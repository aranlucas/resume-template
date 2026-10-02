// JSON Resume → <name>.tex → <name>.pdf (pdflatex must be on PATH).

import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

import { renderResumeDocument } from "./render.mjs";

/**
 * Validates and renders TeX, then compiles in a temporary output directory.
 * Publish the TeX/PDF only after success; keep the log for failed builds.
 * One pass is enough because the templates use bookmark.
 */
export function buildPdf(resume, out, options = {}) {
  const tex = renderResumeDocument(resume, options);
  const output = resolve(out);
  const directory = dirname(output);
  const temporary = mkdtempSync(join(directory, ".resume-template-"));
  const staged = join(temporary, basename(output));
  try {
    writeFileSync(`${staged}.tex`, tex);
    const args = ["-no-shell-escape", "-interaction=nonstopmode", "-halt-on-error", `-output-directory=${temporary}`, `${staged}.tex`];
    try {
      // Keep cwd at the requested destination so relative LaTeX inputs still work.
      execFileSync("pdflatex", args, { cwd: directory, stdio: "pipe", timeout: 120_000 });
    } catch (error) {
      throw new Error(`pdflatex failed; see ${out}.log\n${error.stdout || error.message}`, { cause: error });
    } finally {
      if (existsSync(`${staged}.log`)) copyFileSync(`${staged}.log`, `${output}.log`);
    }
    // A successful process must have produced a PDF before replacing either file.
    if (!existsSync(`${staged}.pdf`)) throw new Error(`pdflatex produced no PDF; see ${out}.log`);
    renameSync(`${staged}.tex`, `${output}.tex`);
    renameSync(`${staged}.pdf`, `${output}.pdf`);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}
