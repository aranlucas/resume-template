# LaTeX Resume Template

A one-page LaTeX resume with ATS-readable PDF output, rendered from a
[JSON Resume](https://jsonresume.org/schema) file. [`resume.json`](resume.json)
is a placeholder example; [`resume.pdf`](resume.pdf) is what it renders to.

## Use it from your own repo

Commit your `resume.json` and add a workflow that calls this repo's reusable
workflow. It builds the PDF on GitHub Actions (no local TeX needed) and commits
`<output>.tex`/`<output>.pdf` back on push; pull requests get them as an artifact.

```yaml
# .github/workflows/pdf.yml
name: PDF
on:
  push:
    branches: [main]
    paths: [resume.json]
  pull_request:
    paths: [resume.json]
  workflow_dispatch:
jobs:
  pdf:
    uses: aranlucas/resume-template/.github/workflows/build-resume.yml@main
    permissions:
      contents: write
    with:
      output: Jane_Doe_Resume # default: resume
```

Dates must be `YYYY-MM`. Jobs whose position ends in "Intern" are merged into one
"Earlier Experience" entry, and `publications` render as a one-line "Writing" row.

## Build locally

Install a TeX distribution such as [MacTeX](https://www.tug.org/mactex/) or
[TeX Live](https://www.tug.org/texlive/) so `pdflatex` is on your `PATH`, then:

```bash
pnpm install
pnpm pdf        # resume.json → resume.tex → resume.pdf
```

From another repo, add this one as a dependency (for example
`"resume-template": "link:../resume-template"`) and run
`resume-template <resume.json> [output name]`. The package also exports
`loadResume`, `assertJsonResume`, `createRenderer`, and `buildPdf` for rendering
your own Nunjucks templates with the same filters.
