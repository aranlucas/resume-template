# Resume Template — Agent Notes

This repository renders a JSON Resume file into a one-page LaTeX resume. The layout is
`templates/resume.tex` (Nunjucks with LaTeX-safe delimiters: `<< value | filter >>`,
`<% for %>`, `<# comment #>`; escape every value with `| tex`, or `| url` inside `\href{}`).
Other repos (notably aranlucas/resume) build their PDFs with it through the reusable
workflow and the `resume-template` CLI, so layout changes reach them too.

## Main Files

- `templates/resume.tex` — the LaTeX layout.
- `lib/` — loading, schema validation, template filters, pdflatex; `bin/` — the CLI.
- `resume.json` — placeholder example content.
- `resume.tex` / `resume.pdf` — generated from `resume.json`, checked in so the rendered
  result is visible on GitHub. Never edit `resume.tex` by hand.
- `.github/workflows/build-resume.yml` — reusable workflow other repos call.
- `README.md` — setup and customization docs for people using the template.

## Content Rules

The content is deliberately placeholder text (Jane Doe, Company A/B/C, State University).
Keep it that way. Do not substitute real names, employers, dates, metrics, or credentials
into this repository — it is a public template, not anyone's actual resume.

## Editing Strategy

- Keep the rendered output to one page.
- Preserve the existing structure: the `\resumeEntry{org}{location}{title}{dates}` macro
  and the `maincolor` accent are the template's defining features.
- Leave `\input{glyphtounicode}` and `\pdfgentounicode=1` in place; they are what keep the
  PDF text-extractable for applicant tracking systems.

## Build And Verify

```bash
pnpm install    # once
pnpm pdf        # validates resume.json, renders resume.tex, runs pdflatex twice
```

If `pdflatex` is not on your `PATH`, see README.md. After a template change, also
rebuild a consumer (for example `pnpm pdf` in `../resume`) to check real content still
fits on one page.

Verify the generated PDF:

```bash
pdfinfo resume.pdf
pdftotext resume.pdf -
pdftoppm -png -r 180 resume.pdf tmp/preview
```

Expected checks:

- `pdfinfo` reports 1 page.
- `pdftotext` shows clean, readable contact info with no garbage characters.
- The rendered PNG has no overlap, clipping, missing glyphs, or cramped footer.
- `resume.log` has no `Overfull`, `Underfull`, `Warning`, or `Error` lines from the final
  build.

Remove temporary render outputs before finishing unless the user wants to keep them.
