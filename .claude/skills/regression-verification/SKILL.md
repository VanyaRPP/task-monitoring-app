---
name: regression-verification
description: Verify that an implemented change actually works and did not regress related behavior. Use after implementation or whenever a task is declared complete. Scale verification to task size: lightweight for small bugs, broader for cross-cutting features.
---

# Regression Verification

A green test suite is evidence, not proof of the intended behavior.

## Commands (this repo)

- Targeted tests: `npx jest <path or pattern>`
- Tests related to changed files: `yarn test:changed`
- Full suite: `yarn test`
- Typecheck: `yarn types:check`
- Lint (read-only): `npx eslint <changed files>` or `yarn lint:check`
- Build: `yarn build` (slow; only for large or config/routing changes)

Never run `yarn lint` or `yarn prettier` for verification: they run `--fix`/`--write` over the whole repo and produce unrelated diffs.

## Small bug / localized change

Verify:

- targeted regression test
- relevant neighboring tests
- typecheck
- eslint on changed files
- actual behavior when it can be checked cheaply

## Large feature / cross-cutting change

Verify proportionally:

- targeted tests
- related/full test suite as appropriate
- typecheck
- eslint on changed files
- build when routing, config, or shared modules changed
- runtime behavior for important flows (use the `run` skill to launch the app)
- permissions/security behavior for sensitive flows

## Failure handling

Never hide a failing check by weakening tests or skipping the relevant path.
If a check fails for reasons unrelated to the change (pre-existing failure), say so explicitly and show it.
If a check cannot run, state exactly what was not verified and why.

## Final report

Summarize:

- what changed;
- what was tested;
- what was runtime-verified;
- any remaining uncertainty.
