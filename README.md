# LaTeX Resume Template

A single-file, one-page LaTeX resume template. Clean Charter typography, a two-row entry
header (organization + location on top, title + dates below), and a PDF that stays
machine-readable so applicant tracking systems can parse it.

The content in `resume.tex` is placeholder text — swap it for your own.

## Installing LaTeX on macOS

You need a TeX distribution (which provides `pdflatex`). Pick one:

### Option 1 — MacTeX (recommended)

The full distribution. Large (~6 GB) but includes every package you're likely to need,
so nothing breaks later.

With [Homebrew](https://brew.sh):

```bash
brew install --cask mactex
```

Or download the installer directly from [tug.org/mactex](https://tug.org/mactex/).

### Option 2 — BasicTeX (minimal)

A ~100 MB subset. Faster to install, but you'll have to add packages yourself.

```bash
brew install --cask basictex
```

Then install the packages this template needs:

```bash
sudo tlmgr update --self
sudo tlmgr install charter titlesec enumitem
```

### After installing

The TeX binaries land in `/Library/TeX/texbin`, which a new install adds to your `PATH` —
but your current shell session won't see it yet. Open a new terminal, then verify:

```bash
pdflatex --version
```

If that still isn't found, add it to your shell profile:

```bash
echo 'export PATH="/Library/TeX/texbin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

## Building the PDF

```bash
pdflatex resume.tex
```

This writes `resume.pdf` alongside a few auxiliary files (`.aux`, `.log`, `.out`) that are
already gitignored. If you don't want to add `/Library/TeX/texbin` to your `PATH`, call the
binary by its full path instead:

```bash
/Library/TeX/texbin/pdflatex resume.tex
```

## Editing in VS Code

Install the [LaTeX Workshop](https://marketplace.visualstudio.com/items?itemName=James-Yu.latex-workshop)
extension. It builds on save and gives you a live PDF preview beside the source.

## Customizing

Everything lives in `resume.tex`:

- **Accent color** — `\definecolor{maincolor}` near the top. It drives the name, section
  headings, rules, and links.
- **Density** — `\setlist[itemize]{...}` controls bullet spacing; the `geometry` margins and
  `\linespread` control the rest. Nudge these to fit one page.
- **Entries** — `\resumeEntry{Organization}{Location}{Title}{Dates}` renders one two-row
  header. Follow it with an `itemize` block of bullets.
- **Sections** — add or remove `\section{...}` blocks freely; the styling is defined once
  and applies everywhere.

The `\input{glyphtounicode}` and `\pdfgentounicode=1` lines near the top are what keep the
PDF's text extractable. Leave them in unless you know you don't need ATS compatibility.

## License

[MIT](LICENSE) — use it however you like.
