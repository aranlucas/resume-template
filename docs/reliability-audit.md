# Correctness and reliability audit — 2026-11-06

## Baseline and inventory (recorded before implementation)

Clean isolated worktree and fetched remote default both at `54594ca` (merged
untangle pass #33). No structural refactor or consumer checkout changes planned.

Public interfaces: CLI positional input/output and `--template`; package exports
`assertJsonResume`, `loadResume`, `createRenderer`, `renderResumeDocument`, `buildPdf`;
Nunjucks filters, delimiters and search-path partial overrides; reusable PDF workflow.
Journeys: JSON loading/validation → template rendering → bounded pdflatex process →
publication of TeX/PDF plus diagnostic log → CI artifact download. Both resume and
CV layouts, missing sections, ongoing/completed internships and ATS extraction matter.

Trust boundaries: JSON schema and month-date validation precede compilation;
plain text and link targets need separate TeX escaping. Custom templates and
relative LaTeX inputs are trusted consumer code. Shell escape is disabled but TeX
is not a sandbox for hostile templates. No accounts, authentication, tenant state,
remote requests, production persistence or retrying service calls exist in this repo.

Failure paths inspected: invalid JSON/schema/dates, missing templates/compiler,
nonzero compiler exit, missing PDF, process timeout, staging cleanup, output paths
with spaces and symlinks, and CI artifact publication. Existing tests cover these
core contracts; compiler failure preserves previous outputs. `buildPdf` is synchronous,
uses unique staging directories and has a 120-second compiler timeout. Concurrent
writers to the same output stem are not a documented transactional API; no new
concurrency guarantee is inferred. Successful writes of two files are separate
renames, not a crash-atomic filesystem transaction.

## Finding R1 — valid contact address breaks compilation (high confidence)

Location: `lib/render.mjs` `escapeUrl`, used by both heading partials. A valid email
such as `jane}doe@example.com` passes JSON Resume email validation but becomes
`\\href{mailto:jane}doe@example.com}{...}`. The unescaped closing brace terminates
the URL argument; actual compilation fails rather than producing the resume.
Expected: preserve readable contact text and encode the unsafe character in the
mailto target. Existing escaping tests cover text punctuation but not this boundary.
Fix: URI-encode braces, backslashes, carets and whitespace before TeX escaping
percent/hash in link targets. Normal sample output and public APIs stay unchanged.

Regression intent: assert the exact encoded mailto target, then run the public CLI
with the address and inspect the real PDF text in CI. A pre-fix CI job runs the
same new regression against baseline code and must observe the named failure.

## Framework and validation plan

Read current quickstart, CI and GitHub Actions docs from e2e.com and inspected the
published `e2e@0.23.0` tarball (npm repository is tester-army/e2e). Required Node is
`^22.22.3 || >=24.8.0`; repository uses 24.22.1. Its shipped
`dist/cli/init/scaffold.js` explicitly supplies a no-engine config with
`targets: [{ name: 'default', platform: 'custom' }]` and an ordinary deterministic
fetch test. `docs/reference/config.mdx` permits an engine-less target without app.
Use that supported runner for child-process CLI flows and real PDF/ATS assertions.
No web/mobile engine, fabricated UI, model calls or credentials are necessary.
Keep all meaningful Vitest and real-PDF checks. Tests/builds run only in CI.

## Rejected hypotheses and limits

- No evidence of shell command injection: compiler is invoked with execFileSync
  and argv; workflow passes input values via environment and quoted arguments.
- No proven dropped ongoing internships: completed-only grouping and existing
  tests establish their separate Present entries.
- No missing empty-section guards: each partial owns its checks as documented.
- General TeX execution from trusted custom templates is intentional, not an
  authorization bug. No arbitrary new hostile-input sandbox requirement is added.
- Existing schema restriction to month/year dates is deliberate and documented.

Independent review and CI outcomes will be appended after implementation.

## Independent implementation review

Native same-provider reviewer statically challenged the findings and implementation.
Confirmed the valid-email defect and the published engine-less runner support.
Identified a reusable-workflow evidence artifact collision for callers verifying two
layouts; fixed by prefixing evidence with `inputs.artifact-name`. No other concrete
worthwhile implementation findings remained. Same-output concurrent publication and
loosely typed extension fields were considered without inventing new API guarantees.
CI results remain pending; no local tests or builds were executed.

CI on `564f3e2` passed the existing Vitest regressions and the baseline proof
(two expected pre-fix mailto failures). Lint caught an unnecessary async callback,
a missing blank line and anonymous default export in the new e2e files; corrected
without changing assertions. Real PDF/e2e validation is still pending.

## CI infrastructure follow-up

On `57005a3`, lint, Vitest and baseline proof passed, as did all five real-PDF
regressions, both e2e CLI/PDF journeys and the one-page sample artifact. The
separate CV artifact job twice exhausted its 15-minute limit downloading TeX
from `azure.archive.ubuntu.com`, before reaching compilation (jobs 128198842735
and 128208069835 in run 42306994533). On hosted images with an apt mirror list,
select Ubuntu’s primary HTTPS archive using that existing declarative file.
Self-hosted runners without that file retain their configured sources. No
packages, assertions or validation gates are removed. Fresh CI is required.
