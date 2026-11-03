# Resume Template — Agent Notes

Keep public examples generic (Jane Doe, Company A/B/C, State University), including
fixtures and rendered artifacts. Real resume content belongs in consumer repos.
`resume.tex` and `resume.pdf` are generated; edit `resume.json` or the templates
and regenerate them. See [README.md](README.md) for setup and section overrides.

## Template changes

- Keep the sample resume on one page; the CV may span pages.
- Preserve `\resumeEntry{org}{location}{title}{dates}` and the `maincolor` accent.
- Keep `\input{glyphtounicode}` and `\pdfgentounicode=1` for ATS text extraction.
- Use Nunjucks delimiters `<< value >>`, `<% block %>`, and `<# comment #>`.
  Escape rendered values with `| tex`, or `| url` inside `\href{}` targets.
- Keep empty-section checks in the partials so consumers can override individual
  sections through `searchPaths` without copying a layout.

After template changes, run `pnpm pdf` and inspect the result:

```bash
pdfinfo resume.pdf
pdftotext resume.pdf -
mkdir -p tmp
pdftoppm -png -r 180 resume.pdf tmp/preview
```

Require one page, readable contact text, no overlap, clipping, missing glyphs or
cramped footer, and no `Overfull`, `Underfull`, `Warning` or `Error` lines in the
final `resume.log`. Remove temporary previews afterward.

Layout changes also reach `aranlucas/resume` (resume) and `aranlucas/resume-yani`
(CV) through the reusable workflow and CLI. When authorized to work in those
consumer checkouts, run their `pnpm pdf` builds and inspect PDF/text output;
the resume must still fit on one page.

## Implementation choices

Before adding a script, try existing tool flags, declarative config, a maintained
plugin, then a one-line native package command. Put assertions in Vitest. A custom
script must implement repository-specific behavior; its first comment explains
why native tooling cannot provide it, it has Vitest coverage, and its PR quotes
that comment.

Use maintained libraries for general-purpose behavior, preferring existing
dependencies: `@jsonresume/schema` with `ajv`/`ajv-formats` for validation,
`nunjucks` for rendering, and `node:util`'s `parseArgs` for CLI arguments. A PR
adding a dependency explains the choice; custom code replacing a library names
the library and why it did not fit.
