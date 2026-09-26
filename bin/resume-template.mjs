#!/usr/bin/env node
// Usage: resume-template <resume.json> [output name, default: the JSON's name]
//   resume.json → resume.tex → resume.pdf, next to the output name.

import { resolve } from "node:path";

import { buildPdf, loadResume } from "../lib/index.mjs";

const [input, output = input?.replace(/\.json$/, "")] = process.argv.slice(2);
if (!input) {
  console.error("Usage: resume-template <resume.json> [output name]");
  process.exit(1);
}

try {
  buildPdf(loadResume(resolve(input)), resolve(output));
  console.log(`Wrote ${output}.tex and ${output}.pdf`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
