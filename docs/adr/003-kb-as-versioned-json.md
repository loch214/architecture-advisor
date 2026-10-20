# ADR-003: Knowledge base as versioned JSON + Zod, no database in v1

- **Status:** Accepted (2026-10-21; implemented in build session 1)

## Context
The KB (styles, scores, drivers, rules, patterns, glossary) is small (tens of KB), read-only at runtime, and changes only through reviewed edits. Every value needs a source tag, and score changes must be visible in review.

## Decision
Store the KB as JSON files in `src/modules/knowledge-base/data/`, validated by Zod schemas at import time, with a semantic `kbVersion`. Integrity checks, a score-matrix snapshot and a release gate (no unreviewed sources) run as tests. No database in v1.

## Consequences
- KB changes go through Git and PR review; the snapshot test makes any score change an explicit diff.
- The KB is bundled into the client, so scoring works offline and costs nothing to serve.
- Results store `kbVersion` and a `snapshot` of the scores used, so old results still render after KB changes.
- Editing needs a code change and deploy; acceptable for a curated KB.
