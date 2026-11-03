---
name: task-clarifier
description: Clarify ambiguous requirements before or during implementation. Use when a task has missing behavior, unclear scope, unclear business rules, unclear permissions, or when new ambiguity is discovered during implementation. Ask questions until there is enough clarity to implement the intended behavior safely; do not ask unnecessary questions for straightforward bugs.
---

# Task Clarifier

Your goal is to prevent high-quality implementation of the wrong requirement.

## Rules

- Read the user's request literally, then inspect relevant code before deciding what is unclear.
- For straightforward bug fixes, do not create bureaucracy. Investigate first.
- For ambiguous work, ask questions early. More useful questions are better than silently guessing.
- If a new ambiguity or contradiction appears during implementation, stop and ask the user instead of choosing a silent assumption.
- A question is valuable when different answers would change behavior, scope, data model, permissions, UX, or tests.
- Do not ask questions whose answers are already present in the request, existing project rules, or the code.
- Group related questions into one message. Keep them concrete and easy to answer.

## Before implementation

State briefly what you understand. Then ask only the questions that materially affect implementation.

For larger features, establish:

- expected behavior
- non-goals
- business rules
- affected entities/data
- permissions/ownership
- error/edge-case behavior
- UI expectations
- test expectations

## During implementation

If new evidence changes the interpretation of the task:

1. stop the affected part of implementation;
2. explain the discovered ambiguity in one or two sentences;
3. ask the smallest set of questions needed to continue safely.

Never hide an assumption that could materially change the result.
