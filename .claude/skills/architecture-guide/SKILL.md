---
name: architecture-guide
description: Project-specific architecture guidance for task-monitoring-app. Use when deciding where logic belongs, how to connect frontend/backend/data layers, or whether to reuse an existing pattern versus create a new abstraction.
---

# Architecture Guide

This project is an established SaaS codebase. Prefer understanding and extending existing patterns over introducing new ones.

## Core principle

Search first, design second, implement third.

Before adding a hook, helper, service, API pattern, selector, model utility, or UI abstraction:

- search for existing equivalents;
- inspect at least one nearby feature with similar behavior;
- reuse the established pattern when it is adequate.

## Layer awareness

For cross-cutting changes, identify the real flow rather than patching only the visible UI:

- page/component
- client state/query
- API route
- business/service logic
- model/database
- permissions/ownership
- tests

Do not duplicate business rules in multiple layers when an existing canonical location already exists.

## Existing-code bias, not blind loyalty

Follow existing conventions by default. You may recommend a better approach when it materially improves correctness, maintainability, security, or consistency.

Before changing an established pattern, explain:

- what the current pattern is;
- why it is insufficient here;
- what the proposed pattern improves;
- what extra complexity it introduces.

Do not perform unrelated cleanup or architectural refactors during feature work.

## Testing constraint

Use the project's existing Jest/Testing Library/MSW-style testing patterns. Do not introduce Playwright or a new test framework unless explicitly requested.
