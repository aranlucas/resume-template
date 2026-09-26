#!/usr/bin/env node
// Usage: resume-template <resume.json> [output name] [--template resume|cv]
//   resume.json → <output>.tex → <output>.pdf; output defaults to the JSON's name.

import { parseArgs } from "node:util";
import { resolve } from "node:path";

import { buildPdf, loadResume } from "../lib/index.mjs";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { template: { type: "string", default: "resume" } },
});
const [input, output = input?.replace(/\.json$/, "")] = positionals;
if (!input) {
  console.error("Usage: resume-template <resume.json> [output name] [--template resume|cv]");
  process.exit(1);
}

try {
  buildPdf(loadResume(resolve(input)), resolve(output), { template: values.template });
  console.log(`Wrote ${output}.tex and ${output}.pdf`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
