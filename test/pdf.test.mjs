import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { buildPdf, loadResume } from "../lib/index.mjs";
import { fixture } from "./fixture.mjs";

function directory(t) {
  const path = mkdtempSync(join(tmpdir(), "resume-real-pdf-"));
  t.after(() => rmSync(path, { recursive: true, force: true }));
  return path;
}

function inspect(out) {
  const info = execFileSync("pdfinfo", [`${out}.pdf`], { encoding: "utf8", timeout: 10_000 });
  const text = execFileSync("pdftotext", [`${out}.pdf`, "-"], { encoding: "utf8", timeout: 10_000, stdio: ["ignore", "pipe", "pipe"] });
  assert.doesNotMatch(readFileSync(`${out}.log`, "utf8"), /Overfull|Underfull|Warning|Error/);
  return { pages: Number(info.match(/^Pages:\s+(\d+)/m)[1]), text };
}

test("the sample stays one page with unchanged ATS text and TeX", (t) => {
  const out = join(directory(t), "sample");
  buildPdf(loadResume(new URL("../resume.json", import.meta.url)), out);
  const result = inspect(out);
  assert.equal(result.pages, 1);
  assert.equal(readFileSync(`${out}.tex`, "utf8"), readFileSync(new URL("../resume.tex", import.meta.url), "utf8"));
  const baseline = execFileSync("pdftotext", [new URL("../resume.pdf", import.meta.url).pathname, "-"], { encoding: "utf8", timeout: 10_000 });
  assert.equal(result.text, baseline);
});

for (const template of ["resume", "cv"]) {
  test(`${template}: optional highlights and escaped text survive actual PDF extraction`, (t) => {
    const data = fixture();
    data.basics.summary = String.raw`path\name {value} & 10% $ # _ ~ ^ — – “quoted”`;
    const out = join(directory(t), template);
    buildPdf(data, out, { template });
    const result = inspect(out);
    assert.equal(result.pages, 1);
    assert.ok(result.text.includes(data.basics.summary));
    assert.match(result.text, /Sep 2026 – Present/);
    assert.match(result.text, /example@example\.com/);
    assert.doesNotMatch(result.text, /undefined|textbackslash|B\.S\., Engineering,/);
  });
}

test("the CV continues across pages with synthetic history", (t) => {
  const data = fixture();
  data.work = Array.from({ length: 20 }, (_, index) => ({
    name: `Example Company ${index + 1}`,
    position: "Example Engineer",
    startDate: "2020",
    endDate: "2021-03",
    highlights: ["Built synthetic examples for testing.", "Reviewed sample changes for clarity."],
  }));
  const out = join(directory(t), "long-cv");
  buildPdf(data, out, { template: "cv" });
  const result = inspect(out);
  assert.ok(result.pages > 1);
  assert.match(result.text, /Example Company 1\b/);
  assert.match(result.text, /Example Company 20\b/);
});

test("an actual TeX failure preserves the last successful output pair", (t) => {
  const root = directory(t);
  const out = join(root, "document");
  buildPdf(fixture(), out);
  const tex = readFileSync(`${out}.tex`);
  const pdf = readFileSync(`${out}.pdf`);
  writeFileSync(join(root, "invalid.tex"), String.raw`\documentclass{article}\begin{document}\unknowncommand\end{document}`);
  assert.throws(() => buildPdf(fixture(), out, { template: "invalid", searchPaths: [root] }), /pdflatex failed/);
  assert.deepEqual(readFileSync(`${out}.tex`), tex);
  assert.deepEqual(readFileSync(`${out}.pdf`), pdf);
  assert.match(readFileSync(`${out}.log`, "utf8"), /Undefined control sequence/);
});
