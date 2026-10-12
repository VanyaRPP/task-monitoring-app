---
name: feature-planner
description: Plan large or cross-cutting features in task-monitoring-app before implementation. Use when a task touches multiple domains, data models, API flows, billing/payments, permissions, or requires coordinated frontend/backend changes. Do not use this heavy workflow for small bug fixes.
---

# Feature Planner

Use this workflow only for genuinely large or cross-cutting work.

## Discovery

Inspect the repository and find existing implementations that are closest to the requested behavior before inventing new patterns.

Trace the affected flow as needed:

UI → client state/query → API → service/business logic → model/database → downstream effects → tests

Also inspect:

- existing permissions and ownership checks
- related domain features
- existing UI patterns
- existing test patterns
- i18n and validation when relevant

## Plan

Produce a concise implementation plan containing:

1. goal and expected behavior;
2. affected areas/files discovered from the repository;
3. data-flow and business-rule implications;
4. permission/security implications;
5. test strategy;
6. migration/backward-compatibility concerns, if any;
7. non-goals.

## Alternatives

When there is a meaningful architectural choice:

- describe the existing approach;
- give the stronger alternative;
- explain trade-offs;
- recommend one.

Do not refactor unrelated code merely because another architecture is cleaner.
Do not invent new abstractions until existing ones have been searched.

## Questions

If discovery exposes a requirement that cannot be safely inferred, invoke the task-clarifier behavior and ask the user before implementation.
