# Untangle decisions — 2026-11-06

## Scope and starting evidence

- Whole repository reviewed: CLI, four library modules, resume/CV layouts and all
  section partials, all tests/fixtures, workflows, package/tool configuration,
  README, roadmap, sample data and generated artifacts.
- Starting commit: `2c88636`; working tree clean. Preserve prior test/documentation
  cleanup in #30/#31 and all public exports, filters, section override contracts,
  generated output, and generic examples.
- Comments and test-quality additions selected. No local tests, benchmarks,
  PDF builds or browser checks are permitted by the latest user instruction.
  No owned test/build process was running at inventory time. Baseline local test
  results are unknown; existing CI history is separate from this change's CI.

## Design and inventory (recorded before implementation)

- Colocate internship selection and condensation in one policy module; keep the
  Nunjucks registration in the renderer.
  - Hidden link: `render.mjs` mixes resume-specific completed-internship rules and
    condensed entry construction with general escaping, dates and environment setup.
  - The `internship`, `completedInternship`, and `condense` extension filters/tests
    must stay compatible with custom Markdown callers as well as the resume partial.
- Use native object/array detection during date traversal.
  - Surplus: `resume.mjs` compiles an additional Ajv schema merely to distinguish
    containers from primitive leaves. Retain Ajv for actual JSON Resume validation.
- Run the existing real-PDF regressions in the repository's PDF CI path.
  - Hidden link: PDF builds in CI do not run `test:pdf`; page count, ATS extraction,
    compiler diagnostics and failure preservation assertions exist but are disconnected.
  - Keep the reusable consumer build production-only by default; opt the repository's
    resume build into verification using its checked-out template revision.
- Remove implementation-restating JS comments. Retain API contracts, external TeX
  constraints, lint reasons and comments that help consumers inspect generated TeX.
- Tests, reviewed last: retain existing behavioral tests. They exercise actual
  template rendering, custom overrides, validation paths, child processes, publication
  on compiler success/failure, ATS output and page budgets. Do not delete meaningful
  safety nets or add tests of module boundaries. Existing internship/custom-renderer
  tests cover policy extraction; existing date tests cover native traversal.

## Deliberately retained special cases

- TeX escaping and URL escaping differ because href targets have different syntax.
- Date validation rejects day precision: templates support month/year dates only.
- Completed internships condense only in the one-page resume; ongoing internships
  remain full entries. CV history remains complete. The SDE abbreviation is existing
  compact-layout behavior and remains compatible.
- CV section tags, heading icons, configurable titles and entry macros support real
  consumer requirements; individual partials retain empty guards and override paths.
- Temporary compilation, timeout, destination cwd, log preservation and missing-PDF
  checks protect existing artifacts and relative input resolution.
- Library loading and document rendering each validate: both are public entry points;
  generic createRenderer intentionally accepts non-Resume data.
- Separate resume/CV layouts vary in typography and pagination; no shared preamble
  framework, speculative plugin system or CLI roadmap feature is introduced.

## Validation and review

- First independent static review identified three worthwhile follow-ups:
  - Trigger PDF verification when Vitest or path-alias configuration changes.
  - Give the parallel resume/CV jobs distinct artifact names: both otherwise
    create `resume`, which upload-artifact cannot accept.
  - Exercise recursive extension-date validation through renderResumeDocument,
    removing a test's dependency on the internal resume module. The expected
    rejection path comes from the input field, not implementation traversal logic;
    this catches a regression that stops validating nested extension arrays.
- All three findings implemented; meaningful tests retained. Existing baseline CI
  at `2c88636` passed; real-PDF assertions were not part of that CI check.
- No local tests/builds run. Second static review identified a compatibility issue with deriving artifact
  names from output paths. Added an explicit artifact-name input defaulting to
  `resume`; only the repository CV job requests `cv`. This preserves consumer
  download names, including custom output names and paths. A fresh final static review found nothing worthwhile left to fix; CI
  results pending. PDF triggers also include committed TeX/PDF baselines,
  Node version and pnpm workspace policy used by the suite.

- Pre-commit lint rejected native typeof traversal under no-runtime-typeof. Kept
  the native check with a narrow documented exception: schema-validated JSON
  contains primitive leaves; this traversal is not a replacement schema parser.
