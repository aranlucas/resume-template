// JSON Resume → <name>.tex → <name>.pdf (pdflatex must be on PATH).

import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { basename, dirname } from "node:path";

import { createRenderer } from "./render.mjs";

/** Renders `resume` to `${out}.tex` and runs pdflatex twice (for hyperref metadata). */
export function buildPdf(resume, out, { searchPaths = [] } = {}) {
  writeFileSync(`${out}.tex`, createRenderer(searchPaths)("resume.tex", resume));
  const args = ["-interaction=nonstopmode", "-halt-on-error", `${basename(out)}.tex`];
  for (let pass = 0; pass < 2; pass++) {
    try {
      execFileSync("pdflatex", args, { cwd: dirname(out) || ".", stdio: "pipe" });
    } catch (error) {
      throw new Error(`pdflatex failed; see ${out}.log\n${error.stdout ?? error.message}`);
    }
  }
}
