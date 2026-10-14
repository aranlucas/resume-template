import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { onTestFinished, test } from "vitest";

import { buildPdf } from "../lib/index.mjs";
import { fixture } from "./fixture.mjs";

// Keep compiler tests independent of the internship-rendering regressions.
function buildFixture() {
  const data = fixture();

  for (const job of data.work) {
    job.position = "Engineer";
  }

  return data;
}

// Real child process + temporary filesystem, with only the TeX executable replaced.
function harness(mode = "success") {
  const directory = mkdtempSync(join(tmpdir(), "resume-build-test-"));
  const bin = join(directory, "bin");
  mkdirSync(bin);
  const out = join(directory, "document with spaces");
  const previousPath = process.env.PATH;
  process.env.PATH = `${bin}:${previousPath}`;
  onTestFinished(() => {
    process.env.PATH = previousPath;
    rmSync(directory, { recursive: true, force: true });
  });
  writeFileSync(
    join(bin, "pdflatex"),
    `#!${process.execPath}
import { writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
const args = process.argv.slice(2);
const output = args.find((a) => a.startsWith('-output-directory='))?.slice('-output-directory='.length) ?? process.cwd();
const stem = basename(args.at(-1), '.tex');
writeFileSync(${JSON.stringify(join(directory, "invocation.json"))}, JSON.stringify({ args, cwd: process.cwd() }));
writeFileSync(join(output, stem + '.log'), 'synthetic compiler log');
${mode !== "no-pdf" ? `writeFileSync(join(output, stem + '.pdf'), ${JSON.stringify(mode === "fail" ? "broken partial PDF" : "synthetic complete PDF")});` : ""}
${mode === "fail" ? "console.log('synthetic compiler failure'); process.exit(1);" : ""}
`,
    { mode: 0o755 },
  );

  return { directory, out };
}

for (const mode of ["fail", "no-pdf"]) {
  test(`failed compilation (${mode}) preserves previous TeX/PDF and keeps diagnostics`, () => {
    const { directory, out } = harness(mode);
    writeFileSync(`${out}.tex`, "known-good TeX");
    writeFileSync(`${out}.pdf`, "known-good PDF");
    assert.throws(
      () => buildPdf(buildFixture(), out),
      mode === "fail"
        ? /pdflatex failed.*see [\s\S]*synthetic compiler failure/
        : /pdflatex produced no PDF/,
    );
    assert.equal(readFileSync(`${out}.tex`, "utf8"), "known-good TeX");
    assert.equal(readFileSync(`${out}.pdf`, "utf8"), "known-good PDF");
    assert.equal(readFileSync(`${out}.log`, "utf8"), "synthetic compiler log");
    assert.ok(!readdirSync(directory).some((name) => name.startsWith(".resume-template-")));
  });
}

test("successful PDF builds publish both files without shell escape or changing the destination cwd", () => {
  const { directory, out } = harness();
  buildPdf(buildFixture(), out);
  assert.match(readFileSync(`${out}.tex`, "utf8"), /Sep 2026 -- Present/);
  assert.equal(readFileSync(`${out}.pdf`, "utf8"), "synthetic complete PDF");
  const invocation = JSON.parse(readFileSync(join(directory, "invocation.json"), "utf8"));
  assert.ok(invocation.args.includes("-no-shell-escape"));
  assert.equal(invocation.cwd, directory);
  assert.ok(!readdirSync(directory).some((name) => name.startsWith(".resume-template-")));
});

test("buildPdf validates before filesystem writes or TeX execution", () => {
  const { directory, out } = harness();
  const data = buildFixture();
  data.work[0].startDate = "2026-09-01";
  assert.throws(() => buildPdf(data, out), /\/work\/0\/startDate/);
  assert.equal(existsSync(`${out}.tex`), false);
  assert.equal(existsSync(join(directory, "invocation.json")), false);
  assert.ok(!readdirSync(directory).some((name) => name.startsWith(".resume-template-")));
});

test("CLI preserves its positional output and --template cv contract", () => {
  const { directory, out } = harness();
  const input = join(directory, "input.json");
  writeFileSync(input, JSON.stringify(buildFixture()));

  const stdout = execFileSync(
    process.execPath,
    [resolve("bin/resume-template.mjs"), input, out, "--template", "cv"],
    { encoding: "utf8", timeout: 10_000 },
  );

  assert.match(stdout, /Wrote .*\.tex and .*\.pdf/);
  assert.match(readFileSync(`${out}.tex`, "utf8"), /Professional Experience/);
  assert.equal(readFileSync(`${out}.pdf`, "utf8"), "synthetic complete PDF");
});

test("CLI usage errors retain stderr and a failing exit status", () => {
  const result = spawnSync(process.execPath, [resolve("bin/resume-template.mjs")], {
    encoding: "utf8",
    timeout: 10_000,
  });

  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /^Usage: resume-template/);
});

test("CLI validation errors do not invoke TeX or print a success message", () => {
  const { directory, out } = harness();
  const input = join(directory, "invalid.json");
  const data = buildFixture();
  data.work[0].startDate = "2026-09-01";
  writeFileSync(input, JSON.stringify(data));

  const result = spawnSync(process.execPath, [resolve("bin/resume-template.mjs"), input, out], {
    encoding: "utf8",
    timeout: 10_000,
  });

  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /\/work\/0\/startDate/);
  assert.equal(existsSync(join(directory, "invocation.json")), false);
  assert.equal(existsSync(`${out}.tex`), false);
  assert.equal(existsSync(`${out}.pdf`), false);
});

test("CLI compiler failures preserve diagnostics and previous output files", () => {
  const { directory, out } = harness("fail");
  const input = join(directory, "input.json");
  writeFileSync(input, JSON.stringify(buildFixture()));
  writeFileSync(`${out}.tex`, "known-good TeX");
  writeFileSync(`${out}.pdf`, "known-good PDF");

  const result = spawnSync(process.execPath, [resolve("bin/resume-template.mjs"), input, out], {
    encoding: "utf8",
    timeout: 10_000,
  });

  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /pdflatex failed.*see [\s\S]*synthetic compiler failure/);
  assert.equal(readFileSync(`${out}.tex`, "utf8"), "known-good TeX");
  assert.equal(readFileSync(`${out}.pdf`, "utf8"), "known-good PDF");
  assert.equal(readFileSync(`${out}.log`, "utf8"), "synthetic compiler log");
});
