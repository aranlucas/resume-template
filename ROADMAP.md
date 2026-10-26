# Resume Template roadmap

Updated 2026-10-26. Proposed library improvements after Digits/MCP priorities.
Keep the product a small renderer with generic placeholder examples.

## Starting point

At `90ff5ede575f0a8412902ca22810ccce09128eb8`, the [renderer](README.md)
already validates JSON Resume, supports one-page and CV layouts, exposes section
overrides through the JavaScript API, and provides a reusable artifact-producing
workflow. Failed compilation preserves previous outputs.

## Ordered releases

1. **Use a custom section from the CLI.** Expose the existing search-path
   customization through a clear CLI option so consumers need no wrapper just
   to replace a section. Acceptance: CLI/API results agree, missing partials
   fail visibly, default lookup remains stable, and a custom path does not
   disable escaping or compiler safeguards.
2. **Understand a failed or overflowing document.** Improve diagnostics that
   connect validation and compiler failures to the relevant source field or
   template section where that mapping is reliable. Acceptance: ambiguous
   compiler output remains explicit, previous artifacts survive failure and
   private resume text is not copied into hosted telemetry.
3. **Choose a layout using useful synthetic examples.** Add small examples of
   sparse, dense and multilingual content within the supported TeX setup.
   Acceptance: the one-page fixture meets its page budget, CV sections omit
   cleanly when empty, and text extraction remains readable. Document unsupported
   fonts/languages rather than implying universal rendering.
4. **Upgrade the two real consumers confidently.** Provide a concise contract
   and migration record for changed fields, filters or layout behavior.
   Acceptance: pinned consumer builds and reviewed PDF/text output support the
   compatibility claim; a successful in-memory render alone does not prove layout.

## First slice and evidence

Start with CLI section customization, using one synthetic fixture and an
existing consumer override. Compare setup steps and custom glue with the API
path. Keep the existing Vitest/compiler and real-PDF test suites as the checks.

Follow [template rules](AGENTS.md): preserve extractable text, escaping and the
one-page layout contract. Never copy real resume content into public examples.
Content ownership and public redaction stay in the consuming repositories.
