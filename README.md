# LaTeX Resume Template

A single-file, one-page LaTeX resume template. Clean Charter typography, a two-row entry
header (organization + location on top, title + dates below), and a PDF that stays
machine-readable so applicant tracking systems can parse it.

The content in `resume.tex` is placeholder text — swap it for your own.

## Installing LaTeX on macOS

You need a TeX distribution (which provides `pdflatex`). Pick one:

### Option 1 — TeX Live via Homebrew formula (recommended)

The full distribution, installed into the Homebrew prefix. ~4.6 GB, and unlike the cask
options it needs **no administrator password**:

```bash
brew install texlive
```

Binaries land in `/opt/homebrew/bin` (Apple Silicon) or `/usr/local/bin` (Intel), which
Homebrew already has on your `PATH`.

### Option 2 — MacTeX

The same distribution packaged by the TeX Users Group, installed to `/Library/TeX`. Use
this if you want the bundled GUI apps (TeXShop, BibDesk) or prefer the official installer.
Requires an administrator password.

```bash
brew install --cask mactex          # ~6 GB, includes GUI apps
brew install --cask mactex-no-gui   # ~4 GB, command line only
```

Or download the installer directly from [tug.org/mactex](https://tug.org/mactex/).

### Option 3 — BasicTeX (minimal)

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

Open a new terminal so your shell picks up the new binaries, then verify:

```bash
pdflatex --version
```

If you installed MacTeX or BasicTeX and that isn't found, their binaries live in
`/Library/TeX/texbin`. Add it to your shell profile:

```bash
echo 'export PATH="/Library/TeX/texbin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

## Building the PDF

```bash
pdflatex resume.tex
```

This writes `resume.pdf` alongside a few auxiliary files (`.aux`, `.log`, `.out`) that are
already gitignored. The checked-in `resume.pdf` is what this source produces, so you can
see the rendered result without building it yourself.

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
