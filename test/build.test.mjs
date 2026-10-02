import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import { buildPdf } from "../lib/index.mjs";
import { fixture } from "./fixture.mjs";

// Keep compiler tests independent of the internship-rendering regressions.
function buildFixture() {
  const data = fixture();
  for (const job of data.work) job.position = "Engineer";
  return data;
}

// Real child process + temporary filesystem, with only the TeX executable replaced.
function harness(t, mode = "success") {
  const directory = mkdtempSync(join(tmpdir(), "resume-build-test-"));
  const bin = join(directory, "bin");
  mkdirSync(bin);
  const out = join(directory, "document with spaces");
  const previousPath = process.env.PATH;
  process.env.PATH = `${bin}:${previousPath}`;
  t.after(() => { process.env.PATH = previousPath; rmSync(directory, { recursive: true, force: true }); });
  writeFileSync(join(bin, "pdflatex"), `#!${process.execPath}
import { writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
const args = process.argv.slice(2);
const output = args.find((a) => a.startsWith('-output-directory='))?.slice('-output-directory='.length) ?? process.cwd();
const stem = basename(args.at(-1), '.tex');
writeFileSync(${JSON.stringify(join(directory, "invocation.json"))}, JSON.stringify({ args, cwd: process.cwd() }));
writeFileSync(join(output, stem + '.log'), 'synthetic compiler log');
${mode !== "no-pdf" ? `writeFileSync(join(output, stem + '.pdf'), ${JSON.stringify(mode === "fail" ? "broken partial PDF" : "synthetic complete PDF")});` : ""}
${mode === "fail" ? "console.log('synthetic compiler failure'); process.exit(1);" : ""}
`, { mode: 0o755 });
  return { directory, out };
}

for (const mode of ["fail", "no-pdf"]) {
  test(`failed compilation (${mode}) preserves previous TeX/PDF and keeps diagnostics`, (t) => {
    const { directory, out } = harness(t, mode);
    writeFileSync(`${out}.tex`, "known-good TeX");
    writeFileSync(`${out}.pdf`, "known-good PDF");
    assert.throws(() => buildPdf(buildFixture(), out), mode === "fail" ? /pdflatex failed.*see [\s\S]*synthetic compiler failure/ : /pdflatex produced no PDF/);
    assert.equal(readFileSync(`${out}.tex`, "utf8"), "known-good TeX");
    assert.equal(readFileSync(`${out}.pdf`, "utf8"), "known-good PDF");
    assert.equal(readFileSync(`${out}.log`, "utf8"), "synthetic compiler log");
    assert.ok(!readdirSync(directory).some((name) => name.startsWith(".resume-template-")));
  });
}

test("successful PDF builds publish both files without shell escape or changing the destination cwd", (t) => {
  const { directory, out } = harness(t);
  buildPdf(buildFixture(), out);
  assert.match(readFileSync(`${out}.tex`, "utf8"), /Sep 2026 -- Present/);
  assert.equal(readFileSync(`${out}.pdf`, "utf8"), "synthetic complete PDF");
  const invocation = JSON.parse(readFileSync(join(directory, "invocation.json"), "utf8"));
  assert.ok(invocation.args.includes("-no-shell-escape"));
  assert.equal(invocation.cwd, directory);
  assert.ok(!readdirSync(directory).some((name) => name.startsWith(".resume-template-")));
});

test("buildPdf validates before filesystem writes or TeX execution", (t) => {
  const { directory, out } = harness(t);
  const data = buildFixture();
  data.work[0].startDate = "2026-09-01";
  assert.throws(() => buildPdf(data, out), /\/work\/0\/startDate/);
  assert.equal(existsSync(`${out}.tex`), false);
  assert.equal(existsSync(join(directory, "invocation.json")), false);
  assert.ok(!readdirSync(directory).some((name) => name.startsWith(".resume-template-")));
});

test("CLI preserves its positional output and --template cv contract", (t) => {
  const { directory, out } = harness(t);
  const input = join(directory, "input.json");
  writeFileSync(input, JSON.stringify(buildFixture()));
  const stdout = execFileSync(process.execPath, [resolve("bin/resume-template.mjs"), input, out, "--template", "cv"], { encoding: "utf8", timeout: 10_000 });
  assert.match(stdout, /Wrote .*\.tex and .*\.pdf/);
  assert.match(readFileSync(`${out}.tex`, "utf8"), /Professional Experience/);
  assert.equal(readFileSync(`${out}.pdf`, "utf8"), "synthetic complete PDF");
});
