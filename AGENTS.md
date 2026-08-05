# Resume Template — Agent Notes

This repository holds a single-file LaTeX resume template. Treat `resume.tex` as the
editable source of truth and `resume.pdf` as a generated artifact that should be rebuilt
after any meaningful edit.

## Main Files

- `resume.tex` — the template source.
- `resume.pdf` — generated PDF, checked in so the rendered result is visible on GitHub.
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
pdflatex -interaction=nonstopmode resume.tex
```

Run it twice if LaTeX reports changed outlines or metadata. If `pdflatex` is not on your
`PATH`, see README.md for macOS setup.

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
