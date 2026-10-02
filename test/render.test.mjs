import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createRenderer, loadResume, renderResumeDocument } from "../lib/index.mjs";
import { fixture } from "./fixture.mjs";

const samplePath = new URL("../resume.json", import.meta.url);

for (const template of ["resume", "cv"]) {
  test(`${template}: ongoing internships remain visible with Present and optional highlights`, () => {
    const data = fixture();
    const original = structuredClone(data);
    const tex = renderResumeDocument(data, { template });
    assert.match(tex, /\\resumeEntry\{Current Company\}\{\}\{Engineering Intern\}\{Sep 2026 -- Present\}/);
    assert.doesNotMatch(tex, /\\begin\{itemize\}/);
    assert.doesNotMatch(tex, /undefined|NaN/);
    assert.deepEqual(data, original);
  });

  test(`${template}: absent, empty and year/month dates render consistently`, () => {
    const data = fixture();
    data.work = [
      { name: "No Dates", position: "Engineer", highlights: [] },
      { name: "Years", position: "Engineer", startDate: "2020", endDate: "2022" },
      { name: "One Month", position: "Engineer", startDate: "2023-10", endDate: "2023-10" },
      { name: "End Only", position: "Engineer", endDate: "2024-01" },
    ];
    const tex = renderResumeDocument(data, { template });
    assert.match(tex, /\\resumeEntry\{No Dates\}\{\}\{Engineer\}\{\}/);
    assert.match(tex, /\{2020 -- 2022\}/);
    assert.match(tex, /\{Oct 2023\}/);
    assert.match(tex, /\{Jan 2024\}/);
    assert.doesNotMatch(tex, /\\begin\{itemize\}/);
  });

  test(`${template}: optional sections do not emit empty list environments`, () => {
    const data = { basics: { name: "Example Person", email: "example@example.com" } };
    const tex = renderResumeDocument(data, { template });
    assert.doesNotMatch(tex, /\\begin\{(?:description|itemize)\}/);
    assert.doesNotMatch(tex, /undefined/);
  });

  test(`${template}: escapes input once, including backslashes, braces and punctuation`, () => {
    const data = fixture();
    data.basics.summary = String.raw`path\name {value} & 10% $ # _ ~ ^ — – “quoted”`;
    const tex = renderResumeDocument(data, { template });
    assert.ok(tex.includes(String.raw`path\textbackslash{}name \{value\} \& 10\% \$ \# \_ \textasciitilde{} \textasciicircum{} --- -- “quoted”`));
    assert.ok(!tex.includes(String.raw`\textbackslash\{\}`));
  });
}

test("completed internships merge without assuming nonempty highlights", () => {
  const data = fixture();
  data.work.push({ name: "Older Company", position: "Engineering Intern", startDate: "2021", endDate: "2022", highlights: ["", " ", "Built tools.", "", "Reviewed changes."] });
  const tex = renderResumeDocument(data);
  assert.match(tex, /\\resumeEntry\{Earlier Experience\}/);
  assert.match(tex, /\{2021 -- 2025\}/);
  assert.match(tex, /\\item Built tools; reviewed changes\./);
  assert.equal((tex.match(/Current Company/g) ?? []).length, 1);
});

test("supported input keeps the checked-in sample TeX byte-for-byte unchanged", () => {
  assert.equal(renderResumeDocument(loadResume(samplePath)), readFileSync(new URL("../resume.tex", import.meta.url), "utf8"));
});

test("invalid schema and unsupported dates fail with field paths before rendering", () => {
  const data = fixture();
  data.work[0].highlights = [42];
  assert.throws(() => renderResumeDocument(data), /\/work\/0\/highlights\/0.*must be string/);
  delete data.work[0].highlights;
  data.work[0].startDate = "2026-09-01";
  assert.throws(() => renderResumeDocument(data), /\/work\/0\/startDate must be "YYYY-MM" or "YYYY"/);
  data.work[0].startDate = "2026-13";
  assert.throws(() => renderResumeDocument(data), /\/work\/0\/startDate/);
});

test("custom Markdown filters and TeX search path overrides remain available", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "resume-render-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  writeFileSync(join(directory, "custom.md"), '<< title >>\n<% for job in work | select("internship") %><< job | dates >><% endfor %>\n<% set earlier = work | condense %><< earlier.dates >>');
  writeFileSync(join(directory, "resume.tex"), '<< basics.name | tex >>');
  const data = fixture();
  assert.match(createRenderer([directory])("custom.md", { title: "Custom Markdown", work: [data.work[0]] }), /Custom Markdown\nSep 2026 – Present2026 – Present/);
  assert.equal(renderResumeDocument(data, { searchPaths: [directory] }), "Example Person");
});
