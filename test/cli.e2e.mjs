import assert from "node:assert/strict";
import { spawnSync, execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "e2e";

import { fixture } from "./fixture.mjs";

for (const template of ["resume", "cv"]) {
  test(`${template}: CLI builds a PDF with valid email braces and preserves it on invalid input`, async () => {
    const root = mkdtempSync(join(tmpdir(), "resume-cli-e2e-"));
    try {
      const input = join(root, "resume.json");
      const output = join(root, "Jane Doe Resume");
      const data = fixture();
      data.basics.email = "jane}doe@example.com";
      writeFileSync(input, JSON.stringify(data));
      const args = [resolve("bin/resume-template.mjs"), input, output, "--template", template];
      const result = spawnSync(process.execPath, args, { encoding: "utf8", timeout: 120_000 });
      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stdout, /Wrote .*\.tex and .*\.pdf/);
      const tex = readFileSync(`${output}.tex`);
      const pdf = readFileSync(`${output}.pdf`);
      const info = execFileSync("pdfinfo", [`${output}.pdf`], { encoding: "utf8" });
      const text = execFileSync("pdftotext", [`${output}.pdf`, "-"], { encoding: "utf8" });
      assert.match(info, /^Pages:\s+1$/m);
      assert.match(text, /jane\}doe@example\.com/);
      assert.match(text, /Sep 2026 – Present/);
      assert.doesNotMatch(readFileSync(`${output}.log`, "utf8"), /Overfull|Underfull|Warning|Error/);

      data.work[0].startDate = "2026-09-01";
      writeFileSync(input, JSON.stringify(data));
      const invalid = spawnSync(process.execPath, args, { encoding: "utf8", timeout: 120_000 });
      assert.equal(invalid.status, 1);
      assert.equal(invalid.stdout, "");
      assert.match(invalid.stderr, /\/work\/0\/startDate/);
      assert.deepEqual(readFileSync(`${output}.tex`), tex);
      assert.deepEqual(readFileSync(`${output}.pdf`), pdf);
      assert.ok(!readdirSync(root).some((name) => name.startsWith(".resume-template-")));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
}
