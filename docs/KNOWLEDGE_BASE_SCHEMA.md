# Knowledge Base Schema

The knowledge base (KB) is a set of JSON files in the repo, validated at build time and in tests with **Zod** (a TypeScript library that checks data against a schema and gives typed results). The KB is versioned. Every result records the `kbVersion` it was computed with.

## Files
```
src/modules/knowledge-base/data/
  meta.json            # version, levels, scale
  attributes.json
  styles.json
  drivers.json
  characteristics.json # workload shape + constraints (form options)
  rules.json
  patterns.json
  glossary.json        # recognised-but-not-ranked items (techs, data architectures, topics)
```

## Shared types
```ts
type Source =
  | { kind: "book"; ref: string; locator?: string }            // e.g. ref "RF2", locator "Fig 14-8"
  | { kind: "ref"; ref: string; url?: string }                 // other published source
  | { kind: "general"; note?: string; reviewed: boolean }      // GK-REVIEW; reviewed=false blocks release
  | { kind: "design"; note: string; reviewed: boolean };

type Score = 1 | 2 | 3 | 4 | 5;
type Level = "none" | "low" | "medium" | "high" | "critical";
```

## meta.json
```json
{
  "kbVersion": "1.0.0",
  "scale": { "min": 1, "max": 5 },
  "levels": { "none": 0, "low": 1, "medium": 2, "high": 3, "critical": 5 },
  "modifierCapPerStyle": 30,
  "maxCriticalSoftLimit": 3
}
```

## attributes.json
```json
[
  {
    "id": "performance",
    "name": "Performance (responsiveness)",
    "short": "How quickly the system answers a request",
    "help": "Choose High if users notice and care about delays, e.g. search, trading, gaming.",
    "example": "95% of result-page requests finish within 2 seconds at peak.",
    "group": "operational",            // operational | engineering | structural | business
    "visibility": "default",           // default | advanced
    "higherIsBetter": true,
    "source": { "kind": "book", "ref": "Bass" }
  }
]
```

## styles.json
```json
[
  {
    "id": "service-based",
    "name": "Service-based architecture",
    "category": "distributed",          // monolithic | distributed
    "partitioning": "domain",           // technical | domain | mixed
    "summary": "A handful of coarse-grained domain services…",
    "costLevel": 2,                     // number of $ (1-5); cost score = 6 - costLevel
    "scores": {
      "simplicity":      { "value": 3, "source": { "kind": "book", "ref": "RF2", "locator": "Fig 14-8" } },
      "security":        { "value": 3, "source": { "kind": "general", "reviewed": false } }
      // ... one entry per scored attribute; validation requires all of them
    },
    "strengths":  ["…"],
    "weaknesses": ["…"],
    "goodWhen":   ["…"],
    "avoidWhen":  ["…"],
    "patterns":     ["api-gateway", "circuit-breaker"],
    "antiPatterns": ["shared-database"],
    "niche": false,
    "aliases": ["SBA", "macroservices", "coarse-grained services"],  // lower-case matched against notes
    "combinesWith": ["event-driven"],
    "source": { "kind": "book", "ref": "RF2", "locator": "Fig 14-8" }
  }
]
```
Validation rules:
- every style has a score for **every** attribute id; values are integers 1–5;
- every `patterns` / `antiPatterns` id exists in `patterns.json`;
- `cost` score must equal `6 − costLevel` (no two sources of truth drifting apart).

## drivers.json
```json
[
  {
    "id": "growth",
    "label": "How much will usage grow?",
    "help": "Think 1–2 years ahead.",
    "options": [
      { "id": "unsure",  "label": "Not sure", "floors": {} },
      { "id": "stable",  "label": "Small and stable", "floors": {} },
      { "id": "rapid",   "label": "Rapid growth",
        "floors": { "scalability": "high", "elasticity": "medium", "availability": "medium", "deployability": "medium" },
        "source": { "kind": "book", "ref": "RF2" } }
    ]
  }
]
```

## characteristics.json
```json
[
  { "id": "async-events", "type": "boolean", "label": "…", "help": "…", "group": "workload", "source": {…} },
  { "id": "domains-clear", "type": "choice", "options": ["yes", "no", "unsure"], "group": "workload", "source": {…} },
  { "id": "hosting", "type": "choice", "options": ["managed-cloud", "vms", "on-prem"], "group": "constraint", "source": {…} }
]
```

## rules.json
Rules are **data, not code**: a small condition language the engine interprets. That keeps rules reviewable and testable without touching engine code.
```json
[
  {
    "id": "R1",
    "name": "Operational maturity",
    "explanation": "Your team is new to running distributed systems, which these styles depend on.",
    "when": { "eq": ["driver.experience", "beginner"] },
    "effects": [
      { "type": "modify", "style": "microservices", "points": -15 },
      { "type": "modify", "style": "service-based", "points": -5 }
    ],
    "source": { "kind": "book", "ref": "RF2", "locator": "ch.18" }
  },
  {
    "id": "R7",
    "name": "Sequential processing",
    "when": { "eq": ["char.sequential-processing", true] },
    "otherwise": [ { "type": "modify", "style": "pipeline", "points": -15 } ],
    "effects":   [ { "type": "modify", "style": "pipeline", "points": 20 } ],
    "source": { "kind": "general", "reviewed": false }
  },
  {
    "id": "R9",
    "when": { "eq": ["char.hosting", "on-prem"] },
    "effects": [ { "type": "exclude", "style": "serverless" } ]
  },
  {
    "id": "R11",
    "when": { "eq": ["char.strict-acid", true] },
    "effects": [
      { "type": "floor", "attribute": "consistency", "level": "critical" },
      { "type": "modify", "style": "event-driven", "points": -15 }
    ]
  }
]
```
Condition operators (kept deliberately tiny): `eq`, `in`, `all` (AND), `any` (OR), `not`. Paths: `driver.<id>`, `char.<id>`.
Effect types: `modify` (points on 0–100 scale), `exclude` (removed from ranking, shown in "Not recommended because…"), `floor` (raise an attribute's minimum importance), `note` (no score change; adds a message such as "consider a hybrid", and a hint for the AI).
Every rule needs a user-facing `explanation`, shown on the result when it fires.

## patterns.json
```json
[
  { "id": "saga", "name": "Saga", "kind": "pattern",        // pattern | anti-pattern
    "problem": "…", "solution": "…", "tradeoffs": ["…"],
    "source": { "kind": "ref", "ref": "microservices.io" } }
]
```

## glossary.json
```json
[
  { "id": "kubernetes", "name": "Kubernetes", "kind": "technology",   // technology | data-architecture | topic | classic-style | approach
    "aliases": ["k8s", "kubernetes"],
    "answer": "A container platform for deploying and scaling services. It's a deployment technology, not an architectural style; it's commonly used with microservices or service-based.",
    "relatedStyles": ["microservices", "service-based"],
    "source": { "kind": "general", "reviewed": true } }
]
```
Alias matching: lower-case, word-boundary regex over the notes; longest alias wins; max 4 matches per request.

## Release gate
A test fails the build in production mode if any `source.reviewed === false`. That way unreviewed general-knowledge scores can't go live by accident. In development they show a "draft" badge in the UI.

## As implemented (build session 1, 2026-10-20)
The Zod schemas live in `src/modules/knowledge-base/schema.ts`; cross-file checks in `integrity.ts`. Additions to the sketch above, all deliberate:
- `general` sources may carry `flagged: true` for estimates the KB draft marks ⚠ (shown as "estimate" on the methodology page).
- Rules with `otherwise` must also have `otherwiseExplanation` (the text shown when the else-branch fires). Note effects may set `warning: true` (N3 becomes a warning instead of a note).
- Rule ids match `R<n>[a-z]` or `N<n>`; notes N1–N3 are rules with `note` effects.
- `patterns.json` entries have `aliases` (so notes mentioning "CQRS" or "saga" match). `glossary.kind` adds `frontend-style`.
- `styles.json` entries have `quanta`; `characteristics.json` choice items have `default`, and rare items `rare: true` (shown under "More situations"). `hosting` gained a `Not sure` option (default) so nothing is pre-selected.
- `meta.json` has `references[]`: the public citation list used by the methodology page.
- `drivers.json`: option ids are `unsure` first, then kebab-case values (`very-limited`, `1-3`, `5+`…).
- Integrity checks: unique ids, every style scores every attribute, `cost = 6 − costLevel`, every referenced style/attribute/pattern/driver option/characteristic value exists, patterns vs anti-patterns used in the right list, every driver has `unsure`, floors have a source.
- Alias matching is implemented in `mentions.ts` (`matchMentions`): pure, longest alias claims its text first, max 4, in order of appearance.
