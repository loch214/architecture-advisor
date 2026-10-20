# ADR-007: Patterns are shown as companions, not ranked

- **Status:** Accepted (2026-10-21)

## Context
Users often mention patterns (CQRS, saga, API gateway, hexagonal) as if they were architecture styles. Patterns solve local problems inside a style; ranking them next to styles would compare unlike things.

## Decision
Only the 13 architecture styles are scored and ranked. Patterns and anti-patterns from the KB are shown as "commonly used with the top pick". Mentions of patterns, technologies and other topics in the notes are matched against KB aliases and answered with a short glossary card ("pattern, not a style: …").

## Consequences
- The ranking stays a like-for-like comparison.
- Every mention gets a short, sourced answer instead of being ignored.
- A user can't ask the tool to rank patterns; that stays a possible future feature.
