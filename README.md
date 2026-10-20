# Architecture Advisor

A free web app that helps students, developers and small teams choose a software architectural style.

Describe your system (the quality attributes you care about, business drivers, constraints, and anything else in plain words). You get:

- a **ranked list of architectural styles** with transparent scores,
- a **plain-language explanation** of the top pick and why the others ranked lower,
- a **trade-off table** built from a curated knowledge base (never AI-generated).

## How it works

A **deterministic rule engine** scores 13 styles against your weighted priorities using a knowledge base drawn from established literature (e.g. Richards & Ford, _Fundamentals of Software Architecture_). An **AI layer** (free-tier Gemini Flash-Lite, falling back to Groq) can nudge scores by at most ±5 points, each with a stated reason, and writes the explanation. If the AI is unavailable, you still get the complete rule-based result.

## Status

🚧 Build in progress: knowledge base and scoring engine done; form and results page next. See [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Run it locally

Needs Node 22+.

```bash
npm install
npm run dev            # http://localhost:3000
npm test               # unit, property, golden-scenario and KB tests
npm run coverage       # same, with coverage thresholds (engine ≥ 95%)
npm run lint           # ESLint (incl. purity rules for the engine)
npm run typecheck      # next typegen + tsc
npm run fitness        # module-boundary and env-name checks
npm run golden:print   # print the top 5 styles for each golden scenario
npm run kb:release-gate  # fails if any KB source is unreviewed
npm run build          # production build
```

## Docs

| Doc                                                  | What's inside                                            |
| ---------------------------------------------------- | -------------------------------------------------------- |
| [Project overview](docs/PROJECT_OVERVIEW.md)         | Goals, users, non-goals                                  |
| [Research](docs/RESEARCH.md)                         | Sources, free LLM tiers, hosting limits                  |
| [Requirements](docs/REQUIREMENTS.md)                 | Functional and non-functional requirements               |
| [Knowledge base draft](docs/KNOWLEDGE_BASE_DRAFT.md) | Styles, scores, drivers, rules, sources, calibration log |
| [KB schema](docs/KNOWLEDGE_BASE_SCHEMA.md)           | JSON structure                                           |
| [Scoring engine](docs/SCORING_ENGINE.md)             | Formula and worked examples                              |
| [AI integration](docs/AI_INTEGRATION.md)             | Providers, prompts, validation, caching                  |
| [Architecture](docs/ARCHITECTURE.md)                 | The app's own architecture (C4, modules, ADRs)           |
| [UI/UX](docs/UI_UX.md)                               | Pages, form, result layout, states                       |
| [Tech stack](docs/TECH_STACK.md)                     | Next.js, TypeScript, Vercel, Upstash                     |
| [Testing](docs/TESTING_STRATEGY.md)                  | Unit, property, golden-scenario and AI tests             |
| [Open questions](docs/OPEN_QUESTIONS.md)             | Decisions log                                            |

## Stack

Next.js · TypeScript · Tailwind + shadcn/ui · Zod · Vercel AI SDK · Upstash Redis · Vitest · Playwright · Vercel (free tier)
