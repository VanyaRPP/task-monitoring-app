---
name: behavioral-testing
description: Design and review tests for real observable behavior in task-monitoring-app. Use whenever behavior changes or a regression test is needed. Prefer tests that would fail if the original bug returned. Do not accept green tests that only prove implementation details.
---

# Behavioral Testing

Testing is part of the implementation, not a final decoration.

## Default

For changed behavior, add or update a test whenever reasonably possible. If you believe a test is not appropriate or practical, explain why, propose the closest alternative verification, and let the user decide for important cases.

## Test the behavior

Before writing a test, answer:

- What user-visible or externally observable behavior changed?
- What was broken?
- What exact behavior proves it is fixed?
- Would the test fail if the original buggy implementation returned?

Prefer:

- user interaction → resulting state/UI/API behavior
- realistic integration through existing boundaries
- business outcome over internal function calls

Avoid tests that only assert:

- a setter/helper was called;
- an internal implementation detail;
- a mock returned the value the test itself configured;
- a component rendered without verifying the changed behavior.

Do not mock away the behavior being tested.
Do not weaken assertions only to make tests pass.
Do not rewrite an existing test merely because the implementation changed if the expected behavior did not change.

## Repository constraints

Use the existing Jest/Testing Library/MSW/mongodb-memory-server patterns already present in the repository.
Do not add Playwright tests unless explicitly requested.

## Final check

Ask: "If I reintroduced the bug, would this test definitely fail?"
If not, strengthen the test or explain why a stronger test is not practical.
