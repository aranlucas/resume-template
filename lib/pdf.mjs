// JSON Resume → <name>.tex → <name>.pdf (pdflatex must be on PATH).

import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { basename, dirname } from "node:path";

import { createRenderer } from "./render.mjs";

/**
 * Renders `resume` with templates/<template>.tex to `${out}.tex` and runs
 * pdflatex. One pass is enough: the templates load `bookmark`, which writes the
 * PDF outline immediately instead of via a second pass over the .out file.
 */
export function buildPdf(resume, out, { template = "resume", searchPaths = [] } = {}) {
  writeFileSync(`${out}.tex`, createRenderer(searchPaths)(`${template}.tex`, resume));
  const args = ["-interaction=nonstopmode", "-halt-on-error", `${basename(out)}.tex`];
  try {
    execFileSync("pdflatex", args, { cwd: dirname(out) || ".", stdio: "pipe" });
  } catch (error) {
    throw new Error(`pdflatex failed; see ${out}.log\n${error.stdout ?? error.message}`);
  }
}
