# Knowledge Base Draft v2

Human-readable source for the JSON knowledge base (structure in `KNOWLEDGE_BASE_SCHEMA.md`). All descriptions are written in our own words.

**Status:** reviewed by Claude on 2026-10-21 at the owner's request, against published sources. Converted to JSON (`src/modules/knowledge-base/data/`, KB v1.0.0) in build session 1; research findings for Q14/Q15 in §8. Calibrated with a scoring simulation (see §8). The owner can still override anything. Items marked ⚠ are the ones most worth a human look.

## Source tags
| Tag | Meaning |
|---|---|
| `book:RF-Fig X` | Star rating from Richards & Ford, *Fundamentals of Software Architecture*, 2nd ed. (O'Reilly, 2025), figure X |
| `book:RF` / `book:Bass` | Concept from R&F, or from Bass, Clements & Kazman, *Software Architecture in Practice* |
| `ref:<name>` | Other published source (listed in §9) |
| `GK` | General knowledge / our judgement, informed by the refs. Reviewed, but less authoritative |
| `DESIGN` | A modelling decision for this app, not a fact |

---

## 1. Quality attributes (scored, user-weighted)
Scores are 1 (poor) to 5 (excellent). For **Low cost** and **Simplicity**, 5 means cheapest / simplest.

| id | Name shown | Plain meaning | Source | Shown |
|---|---|---|---|---|
| `performance` | Performance (responsiveness) | How quickly the system answers | book:Bass; book:RF (responsiveness) | default |
| `scalability` | Scalability | Handles more users/data as demand grows | book:RF | default |
| `elasticity` | Elasticity | Scales up *and back down* quickly for spikes | book:RF | advanced |
| `availability` | Availability / fault tolerance | Keeps working when parts fail | book:Bass; book:RF (fault tolerance) | default |
| `security` | Security | Protects data and functions from misuse | book:Bass | default |
| `maintainability` | Maintainability | Easy to understand, fix and keep healthy | book:RF | default |
| `testability` | Testability | Easy to show it works correctly | book:Bass; book:RF | default |
| `deployability` | Deployability | Easy, low-risk, frequent releases | book:RF | default |
| `evolvability` | Evolvability / modifiability | Easy to add and change features over years | book:Bass (modifiability); book:RF | advanced |
| `modularity` | Modularity | Built from well-separated parts | book:RF | advanced |
| `consistency` | Data consistency | Data always correct and in sync (all-or-nothing transactions) | GK; book:RF (ACID vs eventual consistency discussions) | default |
| `cost` | Low cost | Cheap to build, host and run | book:RF ($ ratings) | default |
| `simplicity` | Simplicity | Easy for a small or less experienced team to build and run | book:RF | default |

**Mapping decisions (`DESIGN`, kept after review):**
- **D1:** Availability uses R&F's *fault tolerance* rating. Close enough for style-level comparison; the methodology page says so.
- **D2:** Performance uses R&F's *responsiveness* (the 2nd edition's name for it).
- **D3:** Cost score = `6 − number of $`.

**Not scored (`DESIGN`):**

| Attribute | Reason |
|---|---|
| Usability | Decided by UI design, not style |
| Interoperability | Decided by protocols and interfaces; roughly equal across styles |
| Auditability | Covered better by patterns (event sourcing, audit log) |
| Agility | Combination of deployability, testability and evolvability; would count twice |
| Observability | Operational practice, needed by all distributed styles; shows up as a caution instead |

---

## 2. Ranked styles: score matrix

Columns: Simp, Mod, Main, Test, Depl, Evol, Perf, Scal, Elas, Avail, Cost, Sec, Cons.

| Style (id) | Simp | Mod | Main | Test | Depl | Evol | Perf | Scal | Elas | Avail | Cost | Sec | Cons | Category |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Layered (`layered`) | 5 | 1 | 1 | 2 | 1 | 1 | 3 | 1 | 1 | 1 | 5 | 3 | 5 | monolithic |
| Modular monolith (`modular-monolith`) | 5 | 2 | 2 | 2 | 2 | 2 | 3 | 1 | 1 | 1 | 5 | 3 | 5 | monolithic |
| Microkernel (`microkernel`) | 4 | 3 | 3 | 3 | 3 | 3 | 3 | 1 | 1 | 1 | 5 | 3 | 4 | monolithic |
| Pipeline (`pipeline`) | 5 | 3 | 3 | 3 | 2 | 3 | 2 | 1 | 1 | 1 | 5 | 3 | 4 | monolithic |
| Service-based (`service-based`) | 3 | 3 | 4 | 4 | 4 | 4 | 3 | 3 | 2 | 3 | 4 | 3 | 4 | distributed |
| Event-driven (`event-driven`) | 2 | 4 | 4 | 2 | 3 | 5 | 5 | 4 | 3 | 5 | 3 | 3 | 2 | distributed |
| Space-based (`space-based`) | 1 | 3 | 3 | 1 | 3 | 3 | 5 | 5 | 5 | 2 | 2 | 3 | 2 | distributed |
| Microservices (`microservices`) | 1 | 5 | 5 | 5 | 5 | 5 | 2 | 5 | 4 | 5 | 1 | 3 | 2 | distributed |
| Orchestration-driven SOA (`soa`) | 1 | 3 | 1 | 1 | 1 | 1 | 2 | 4 | 3 | 3 | 1 | 3 | 3 | distributed |
| Serverless (`serverless`) | 2 | 4 | 3 | 2 | 4 | 4 | 2 | 5 | 5 | 4 | 3 | 3 | 2 | distributed |
| Cell-based (`cell-based`) | 1 | 4 | 3 | 3 | 4 | 3 | 4 | 5 | 4 | 5 | 1 | 4 | 3 | distributed |
| Peer-to-peer (`peer-to-peer`) | 2 | 3 | 2 | 1 | 2 | 2 | 3 | 5 | 4 | 5 | 4 | 2 | 1 | distributed |
| Edge–cloud (`edge`) | 1 | 3 | 2 | 2 | 2 | 3 | 5 | 4 | 3 | 4 | 2 | 2 | 2 | distributed |

### Sources per row
| Style | Simp → Avail, Cost | Sec, Cons | Notes from review |
|---|---|---|---|
| Layered | book:RF-Fig 10-6 | GK | Responsiveness is 3 in the book (I'd guessed 2 in v1; corrected) |
| Modular monolith | book:RF-Fig 11-7 | GK | ⚠ The book rates modularity, maintainability, testability, deployability and evolvability only **2**. Lower than common opinion, but we follow the source. R18 (below) carries the book's "start here when direction is uncertain" advice |
| Microkernel | book:RF-Fig 13-9 | GK | — |
| Pipeline | GK (R&F 1st ed. ratings: simplicity 5, modularity 3, testability 3, deployability 2, evolvability 3, performance 2, scalability/elasticity/fault tolerance 1, cost $) | GK | ⚠ Partly corroborated online (2026-10-20, §8): secondary summaries of the 1st ed. agree on cost $, simplicity 5, deployability 2, elasticity/scalability 1, fault tolerance 1, modularity/testability/evolvability 3. The book figure itself couldn't be opened. Maintainability 3 is our estimate (the 1st ed. doesn't rate it). Kept, flagged |
| Service-based | book:RF-Fig 14-8 | GK | — |
| Event-driven | book:RF-Fig 15-39 | GK | — |
| Space-based | book:RF-Fig 16-18 | GK | — |
| Microservices | book:RF-Fig 18-16 | GK | — |
| SOA | GK (R&F 1st ed. from memory) | GK | ⚠ No published per-characteristic table found online (2026-10-20, §8). Secondary write-ups agree qualitatively: complex, expensive, poor testability/deployability, fairly scalable/elastic. Kept, flagged. Rarely recommended by design |
| Serverless | GK; ref:Roberts, ref:serverless-tradeoffs, ref:PrimeVideo | GK | ⚠ All ours. **Lowered in calibration** (simplicity 3→2, testability 3→2, deployability 5→4, performance 3→2, cost 4→3, security 4→3): v1 values made serverless win ordinary student and prototype scenarios |
| Cell-based | GK; ref:AWS-cells | GK | Fault *isolation* (not just tolerance) is the point; expensive and complex |
| Peer-to-peer | GK | GK | Niche; gated by R16 |
| Edge–cloud | GK; ref:edge | GK | Niche; gated by R17 |

**Security (GK):** style has a weak effect, so most styles are a neutral 3. Cell-based is 4 (small blast radius). P2P and edge are 2 (no central trust point / many exposed devices). Microservices stays 3: more endpoints, but stronger isolation.

**Consistency (GK):** monoliths with one database get 5; service-based gets 4 (ACID within a service, shared DB); styles built on async messaging or replicated in-memory data get 2; P2P gets 1.

---

## 3. Style descriptions

Each has: summary · partitioning · strengths · weaknesses · good when · avoid when · combines well with · patterns · aliases (for matching free text).

### Layered `layered` [book:RF ch.10]
- **Summary:** horizontal technical layers (presentation, business, persistence, database) in one deployable. Layers can be *closed* (requests must pass through) or *open* (can be skipped); closed layers give isolation, so changes stay inside a layer.
- **Partitioning:** technical. **Quanta:** 1.
- **Strengths:** simplest and cheapest; familiar; fine to start with before the long-term direction is clear.
- **Weaknesses:** a feature change touches every layer; "architecture sinkhole" (requests passed down layers that add nothing); scales and deploys only as a whole; tends to erode into a big ball of mud.
- **Good when:** small/simple apps and websites; tight budget and schedule; changes are mostly *technical* (swap UI framework or database).
- **Avoid when:** large systems needing scalability, agility or frequent independent deployment.
- **Patterns:** MVC. **Aliases:** n-tier, 3-tier, multi-tier, MVC monolith.

### Modular monolith `modular-monolith` [book:RF ch.11]
- **Summary:** one deployable split into business-domain modules (orders, inventory, payments…), with layers inside each module if needed. Modules live in one repo or as separate built artifacts (JAR/DLL) combined at deploy. Usually one database, but per-module databases are allowed.
- **Partitioning:** domain. **Quanta:** 1.
- **Strengths:** simple and cheap; fits Domain-Driven Design; teams can own a module; easy to evolve later into service-based or microservices.
- **Weaknesses:** needs strict governance or the module boundaries erode; whole app scales and deploys together; technical changes (new UI or DB tech) ripple across every module.
- **Good when:** starting a new system, especially when its future direction is uncertain; tight budget or time.
- **Avoid when:** high scalability, availability or responsiveness needs; mostly technical changes.
- **Combines with:** event-driven parts later; extraction to service-based. **Patterns:** Hexagonal/Clean inside modules, Strangler Fig. **Aliases:** modulith, majestic monolith, monolith, single app.

### Microkernel `microkernel` [book:RF ch.13]
- **Summary:** a stable minimal core plus independent plug-ins for specialised, variable or customer-specific features. A plug-in registry and contracts define how they connect. Plug-ins are compile-time or runtime; remote plug-ins (REST/messaging) bring distributed complexity.
- **Partitioning:** technical and/or domain. **Quanta:** 1.
- **Strengths:** easy to add, remove or customise features; keeps messy custom logic out of the core.
- **Weaknesses:** the core is a change bottleneck; contract versioning; limited scalability.
- **Good when:** product-style software (IDEs, CI servers, issue trackers, browsers); domains with lots of per-customer or per-region rule variation.
- **Avoid when:** no real need for extensibility.
- **Niche:** gated by R8. **Aliases:** plug-in architecture, plugin, extension-based.

### Pipeline `pipeline` [book:RF (pipeline chapter); GK]
- **Summary:** data flows one way through independent processing steps (filters) linked by pipes.
- **Strengths:** simple; steps are reusable and testable.
- **Weaknesses:** poor fit for interactive request/response apps; limited scale and fault tolerance as a monolith.
- **Good when:** ETL, media or data processing, compilers, batch jobs, CI pipelines.
- **Niche:** gated by R7. **Aliases:** pipes and filters, ETL, batch pipeline, data pipeline.

### Service-based `service-based` [book:RF ch.14]
- **Summary:** about 4–12 coarse-grained, separately deployed domain services, usually sharing one database.
- **Strengths:** practical distribution at moderate cost; good maintainability, testability and deployability; ACID inside a service.
- **Weaknesses:** coarse scaling; weak elasticity; shared-database coupling; schema changes need coordination.
- **Good when:** business apps with clear domains, moderate scale, gradual move away from a monolith.
- **Patterns:** API Gateway, Circuit Breaker. **Aliases:** SBA, macroservices, coarse-grained services.

### Event-driven `event-driven` [book:RF ch.15]
- **Summary:** components react asynchronously to events through a broker (choreographed) or a mediator (orchestrated).
- **Strengths:** very responsive, scalable and fault tolerant; easy to add new reactions.
- **Weaknesses:** hard to test and debug; workflow state and error handling are hard; nondeterministic; eventual consistency.
- **Good when:** the business reacts to things happening; async or parallel work; IoT, notifications, real-time flows.
- **Avoid when:** strict, deterministic request/response workflows.
- **Patterns:** Pub/Sub, Competing Consumers, Saga, CQRS, Event Sourcing, Outbox. **Aliases:** EDA, event-based, message-driven, reactive, Kafka-based, broker/mediator topology.

### Space-based `space-based` [book:RF ch.16]
- **Summary:** processing units keep data in replicated in-memory grids; the database is updated asynchronously, outside the request path.
- **Strengths:** top responsiveness, scalability and elasticity under huge, spiky load.
- **Weaknesses:** very complex, hard to test, expensive; data collisions; weaker fault tolerance.
- **Good when:** ticketing, auctions, flash sales, where a central database would choke.
- **Niche:** gated by R6. **Aliases:** tuple space, in-memory data grid, cloud-native space.

### Microservices `microservices` [book:RF ch.18]
- **Summary:** many small single-purpose services, each owning its data within a bounded context, deployed independently.
- **Strengths:** top modularity, deployability, testability per service, scalability and fault tolerance; team autonomy.
- **Weaknesses:** highest cost and complexity; latency; distributed data; needs strong DevOps automation; "grains of sand" risk (services split too small).
- **Good when:** clear bounded contexts, many teams, high scale, frequent independent releases, mature operations.
- **Avoid when:** small team; tightly coupled domain; no automation maturity.
- **Patterns:** API Gateway, BFF, Service Discovery, Sidecar/Mesh, Circuit Breaker, Saga, CQRS. **Aliases:** MSA, micro-services, Kubernetes services.

### Orchestration-driven SOA `soa` [book:RF; GK]
- **Summary:** enterprise services coordinated through a central orchestration engine or ESB (enterprise service bus).
- **Strengths:** large-scale enterprise integration.
- **Weaknesses:** very complex, expensive, hard to change and test; everything coupled to the bus.
- **Good when:** existing enterprise integration landscapes. Almost never for new systems.
- **Aliases:** SOA, ESB architecture, enterprise service bus.

### Serverless `serverless` [ref:Roberts; ref:serverless-tradeoffs; GK]
- **Summary:** functions (FaaS) and managed backend services (BaaS: managed auth, databases, storage such as Firebase or Supabase) run by a cloud provider; pay per use; no servers to manage.
- **Strengths:** automatic scaling to zero and to large bursts; no server operations; cheap at low or spiky traffic.
- **Weaknesses:** cold starts; vendor lock-in through provider-specific triggers and identity; expensive under steady heavy load; local testing and debugging are harder; distributed state; execution time limits.
- **Good when:** event-triggered tasks, spiky or low traffic, small teams that want no ops, MVPs on BaaS.
- **Avoid when:** on-premise only; strict lock-in limits; steady high throughput; long-running processes.
- **Aliases:** FaaS, AWS Lambda, Cloud Functions, Azure Functions, BaaS, Firebase, Supabase, Jamstack.

### Cell-based `cell-based` [ref:AWS-cells; GK]
- **Summary:** the whole stack is copied into independent cells, each serving a subset of customers, with a thin routing layer in front that uses a partition key.
- **Strengths:** fault *isolation* (a failure affects one cell only); predictable, testable maximum scale per cell; scale by adding cells.
- **Weaknesses:** routing, cell-sizing, deployment and monitoring overhead; expensive; cross-cell features are hard.
- **Good when:** large, critical multi-tenant platforms where limiting the blast radius matters.
- **Niche:** gated by R14. **Aliases:** cellular architecture, bulkhead architecture, shuffle sharding.

### Peer-to-peer `peer-to-peer` [GK]
- **Summary:** nodes act as both clients and servers and share resources directly, with little or no central server.
- **Strengths:** scales with the number of peers; no single point of failure; low central infrastructure cost.
- **Weaknesses:** hard to secure and moderate; weak consistency; hard to test; unpredictable peer quality.
- **Good when:** file sharing, decentralised or blockchain apps, local-first/offline collaboration, LAN multiplayer.
- **Niche:** gated by R16. **Aliases:** P2P, decentralized, mesh network, blockchain, dApp, local-first.

### Edge–cloud `edge` [ref:edge; GK]
- **Summary:** processing runs near the data source (devices, gateways, edge locations), with the cloud used for coordination, storage and heavy analytics.
- **Strengths:** very low latency; keeps working offline or on poor networks; less bandwidth used.
- **Weaknesses:** many devices to deploy, update and secure; weak edge hardware; data sync and consistency.
- **Good when:** industrial IoT, retail stores, vehicles, AR/VR, video analytics on site.
- **Niche:** gated by R17. Often combined with event-driven. **Aliases:** edge computing, fog computing, IoT gateway, on-device.

---

## 4. Not ranked, but recognised (so every user mention gets a sensible answer)

The app keeps a glossary. If the user's notes mention one of these, the AI gets a 1–2 line KB snippet (found by deterministic keyword match on aliases, see `AI_INTEGRATION.md`), and the result page can show an info card.

| Item | Type | What we tell the user |
|---|---|---|
| CQRS, Event Sourcing, Saga, Outbox | Pattern | Patterns used *inside* a style; shown as companions |
| API Gateway, BFF, Service Discovery, Sidecar, Service Mesh, Circuit Breaker | Pattern | Companions for distributed styles |
| MVC / MVP / MVVM | Presentation pattern | Organises UI code; works with any style |
| Hexagonal (ports & adapters), Clean, Onion | Internal structure pattern | How to organise code *inside* a deployable; recommended with modular monolith and inside services |
| Domain-Driven Design | Design approach | Finds module/service boundaries; supports modular monolith and microservices |
| Micro-frontends | Frontend style | Suggested as an add-on when several teams own one large web frontend (note N2); otherwise not worth it |
| Monolith (generic) | Alias | Maps to layered / modular monolith |
| Big ball of mud, distributed monolith, god service, chatty services, shared DB between services, golden hammer, entity services, grains of sand, architecture sinkhole | Anti-pattern | Shown as warnings under relevant styles |
| Client–server / two-tier | Classic style | Mostly covered by layered (one server + clients); mentioned for desktop + DB apps |
| Actor model (Akka, Orleans) | Concurrency model | Can implement event-driven or space-like systems; mention for highly concurrent stateful work |
| Blackboard | Classic style | Rare (AI/speech systems); explain and map to event-driven |
| Lambda / Kappa architecture, data lake/lakehouse, data mesh | Data architecture | Out of scope (analytics platforms, not application style). Explain briefly |
| LLM / RAG / agentic AI apps | Components, not a style | AI parts sit inside any style; note reliability, latency, cost and provider swap-ability |
| Kubernetes, Docker, MERN/MEAN, Spring, .NET | Technology, not a style | Explain the difference; map to deployment or stack choices |
| Multi-tenant SaaS, mobile backend, offline-first | System characteristic | Maps to form options (blast radius, serverless/BaaS, edge/P2P) |

---

## 5. Business drivers → attribute floors

Every driver has **"Not sure"** (no floor). Nothing is pre-selected. A floor means `effective level = max(user level, floor)`. Sources: book:Bass and book:RF (translate business drivers into quality attributes; the rapid-growth mapping follows R&F's own example). Values are `DESIGN`.

| Driver | Option → floors |
|---|---|
| Time to market | Tight → simplicity ≥ Medium · Very tight → simplicity ≥ High, deployability ≥ Medium |
| Budget | Moderate → cost ≥ Medium · **Very limited → cost ≥ Critical**, simplicity ≥ Medium |
| Team size | **1–3 → simplicity ≥ Critical** · 4–10 → simplicity ≥ Medium · 11–30 → modularity ≥ Medium, deployability ≥ Medium · 30+ → modularity ≥ High, deployability ≥ High, maintainability ≥ Medium |
| Team experience (distributed systems/DevOps) | Beginner → simplicity ≥ High (+ R1) |
| Expected growth | Moderate → scalability ≥ Medium · Rapid → scalability ≥ High, elasticity/availability/deployability ≥ Medium · Unpredictable spikes → elasticity ≥ High, scalability ≥ High, performance ≥ Medium |
| Expected lifespan | Prototype → simplicity ≥ High, cost ≥ Medium · 5+ years → maintainability ≥ High, evolvability ≥ High |
| Requirement change rate | Constantly → evolvability ≥ High, deployability ≥ Medium, testability ≥ Medium |

Calibration changes in bold: "very limited budget" and "1–3 people" were raised from High to Critical. Without that, the many 4–5 ratings of distributed styles drowned out cost and simplicity for small, cash-poor teams.

Levels: Not needed 0 · Low 1 · Medium 2 · High 3 · Critical 5.

---

## 6. System characteristics and constraints (form inputs)

| id | Label (plain) | Type |
|---|---|---|
| `domains-clear` | Does it split into clear, separate business areas? | yes / no / not sure |
| `async-events` | It mainly reacts to events or runs background/async workflows | bool |
| `spiky-concurrency` | Very high or sharply spiky concurrent load (ticket drops, flash sales) | bool |
| `sequential-processing` | It processes data in sequential steps (ETL, media, batch) | bool |
| `plugins` | Needs plug-ins, extensions or per-customer customisation | bool |
| `strict-workflow` | Workflows must be strictly controlled and predictable | bool |
| `steady-heavy-load` | Constant, heavy, predictable load around the clock | bool |
| `blast-radius` | Failures must only affect a subset of customers (large multi-tenant) | bool |
| `p2p` | Users/devices share directly with each other, little or no central server | bool |
| `edge` | Must process near devices: ultra-low latency, or keep working offline on site | bool |
| `tech-changes` | Most expected changes are technical (swap UI framework, database) rather than business features | bool |
| `mixed-scopes` | Parts of the system have very different needs (e.g. public site vs back office) | bool |
| `multi-team-frontend` | Several teams will work on one large web frontend | bool |
| `hosting` | Managed cloud OK / VMs or containers only / on-premise or single server | choice |
| `no-lock-in` | Must avoid vendor lock-in | bool |
| `strict-acid` | Strict all-or-nothing transactions across the whole system | bool |
| `legacy-migration` | Migrating from an existing monolith | bool |
| `regulated` | Regulated data (health, finance, personal data) | bool |

---

## 7. Rules

Points are on the 0–100 scale; each style's rule total is capped at ±30. **Principle:** rules encode what the attribute matrix can't express (operational maturity, workload shape, hard limits). Budget and deadline work through floors.

| Rule | When | Effect | Source |
|---|---|---|---|
| R1 Ops maturity | experience = Beginner | microservices −15, cell-based −15, space-based −10, soa −10, P2P −10, edge −10, **service-based −10, serverless −10**, event-driven −5 | book:RF (microservices needs automation maturity); ref:TeamTopologies |
| R1b Tiny team | R1 AND team 1–3 | microservices −5, cell-based −5 | ref:TeamTopologies |
| R2 No clear domains | domains-clear = no | microservices −15, service-based −5 | book:RF ch.18 |
| R3 Many teams + domains | domains-clear = yes AND team ≥ 11 | microservices +5, service-based +5, modular monolith +3 | book:RF; ref:TeamTopologies |
| R4 Event workload | async-events | event-driven +15, serverless +5 | book:RF ch.15 |
| R5 Strict workflow | strict-workflow | event-driven −10 | book:RF ch.15 |
| R6 Spiky concurrency | spiky-concurrency | space-based +15, serverless +5; *else* space-based −10 | book:RF ch.16 |
| R7 Sequential processing | sequential-processing | pipeline +20; *else* −15 | book:RF |
| R8 Plug-ins | plugins | microkernel **+25**; *else* −15 | book:RF ch.13 |
| R9 On-prem / single server | hosting = on-prem | serverless EXCLUDED; microservices −15, cell-based −20, space-based −10 | GK |
| R9b VMs only | hosting = VMs | serverless EXCLUDED | GK |
| R10 No lock-in | no-lock-in | serverless −15 | ref:serverless-tradeoffs |
| R11 Strict ACID | strict-acid | consistency floor Critical; event-driven −15, space-based −15, P2P −15, microservices −10, serverless −10, edge −10, cell-based −5 | book:RF (distributed data) |
| R12 Legacy migration | legacy-migration | service-based +10, modular monolith +5, microservices −5 | book:RF ch.14 |
| R13 Steady heavy load | steady-heavy-load | serverless −10 | ref:PrimeVideo; ref:serverless-tradeoffs |
| R14 Blast radius | blast-radius | cell-based +15; *else* −10 | ref:AWS-cells |
| R15 Regulated | regulated | security floor High | GK |
| R16 Peer-to-peer | p2p | P2P +20; *else* −20 | GK |
| R17 Edge | edge | edge +20; *else* −20 | ref:edge |
| R18 **New system, direction uncertain** | growth ∈ {stable, not sure} AND lifespan ≠ 5+ | modular monolith +10, layered +5 | book:RF ch.10–11 (start simple, evolve later) |
| R19 **Technical changes dominate** | tech-changes | modular monolith −10, layered +5 | book:RF ch.11 |

**Notes (no score change, shown on the result and sent to the AI):**
- N1 `mixed-scopes` → "Consider a hybrid: different parts may deserve different styles (separate architectural quanta)." (book:RF ch.7)
- N2 `multi-team-frontend` → suggest micro-frontends as an add-on.
- N3 Budget, team size and experience all "Not sure" → warning: "Without budget/team info, results lean towards feature-rich distributed styles, which may underweight cost and complexity."

---

## 8. Calibration log (scoring simulation, 2026-10-21)
A scratch simulation ran all golden scenarios (`TESTING_STRATEGY.md`).
1. **v1 matrix + book monolith ratings** → serverless won the student, solo-prototype and ticketing scenarios; service-based beat modular monolith for beginners. ✗
2. **Fixes:** serverless toned down; R1 strengthened for service-based/serverless; budget-very-limited and team-1–3 floors raised to Critical; R18 and R19 added (book advice on monoliths); R8 raised to +25. ✓
3. **Result:** all 16 golden scenarios match expectations (G10 "startup MVP with spiky traffic and tiny budget" is a deliberate conflict case, where service-based and serverless tie).

### Build session 1 (2026-10-20): research and first real tests
**No score or rule value changed.** Findings:

4. **Q14, pipeline.** WebSearch only (O'Reilly and most sites were unreachable from the build container, so no page could be opened directly). Secondary summaries of the R&F 1st ed. pipeline chapter (ref:RF-summaries: kb.segersian.com "Pipeline", bagerbach.com book notes) agree with our values on cost (low), simplicity (high), deployability 2, elasticity and scalability 1, fault tolerance 1, and give modularity, testability and evolvability 3 and reliability 3. One Medium chapter summary disagrees (modularity 5, deployability/testability 3) and was treated as an outlier. → Values kept; source note upgraded from "from memory" to "corroborated by secondary summaries"; still `flagged` until someone checks the book.
5. **Q14, orchestration-driven SOA.** No per-characteristic ratings found. One book summary (danlebrero.com, 2021) says the style gets the lowest star total of all styles in the book (22 vs microservices 40), which fits our low row. Qualitative sources (InfoWorld, doubleSlash blog, LinkedIn articles on SOA) agree: complex, expensive, poor testability and deployability, fairly scalable and elastic, orchestrator as bottleneck. → Kept as flagged estimates.
6. **Q15, modular monolith.** Searched for independent ratings (Head First Software Architecture ch. 7 has its own star ratings but they aren't reproduced online; ardalis.com "Goldilocks architecture"; Milanović; Shopify's modular monolith as described by encore.dev; arXiv 2401.11867 "Modular Monolith: A Software Architecture Trend"). None gives numbers. They agree on direction: better modularity and maintainability than an unstructured monolith *only if boundaries are enforced*; deployability and scaling stay whole-app. One summary of the book calls modularity a "primary strength", which is relative to layered (2 vs 1). → No strong cited evidence against Fig 11-7, so we keep the book's 2s.
7. **Spot-checks.** Serverless (Netguru 2026, tianpan.co 2026, redwerk 2026): cold starts, lock-in, steady-load cost and harder debugging all confirmed; our lowered values stand. Cell-based (AWS cell-based guidance on GitHub, kerneltalks series): blast-radius isolation vs duplicated fixed cost and operational overhead confirmed. Edge (arXiv 2505.01821 survey, Forrester): latency and offline strengths, device security and sync weaknesses confirmed. Peer-to-peer: no source contradicted the GK row. → No changes.
8. **Golden scenarios as real tests.** The planning simulation didn't keep its inputs, so the build wrote them (`tests/scoring/golden.ts`). Worked examples A and B reproduce every documented number. All 16 pass. Two sensitivities found (G7: microservices ties pipeline if the user rates maintainability + testability High; G11: microservices beats cell-based with clear domains, 30+ devs and deployability High). Inputs chosen to match each scenario's title; sensitivities logged as Q20 for the owner rather than changing rules without a source.
9. **Review status in the JSON.** Following Q2 (KB review delegated to Claude), every GK/DESIGN item is `reviewed: true`, so the release gate passes. Items the draft marks ⚠ carry `flagged: true` (pipeline and SOA book-derived scores, all serverless scores) so the methodology page can show them as estimates.

---

## 9. References (public)
- **RF:** M. Richards, N. Ford, *Fundamentals of Software Architecture*, 2nd ed., O'Reilly, 2025 (and 1st ed., 2020)
- **Bass:** L. Bass, P. Clements, R. Kazman, *Software Architecture in Practice*
- **Roberts:** M. Roberts, "Serverless Architectures", martinfowler.com
- **serverless-tradeoffs:** practitioner analyses of cold starts, lock-in and steady-load cost (Netguru guide 2026; tianpan.co forum 2026)
- **PrimeVideo:** Amazon Prime Video tech blog, "Scaling up the Prime Video audio/video monitoring service and reducing costs by 90%" (2023)
- **AWS-cells:** AWS Well-Architected, *Reducing the Scope of Impact with Cell-Based Architecture* (2023)
- **edge:** Thoughtworks Decoder "Edge computing"; KAUST edge vs cloud latency study
- **TeamTopologies:** M. Skelton, M. Pais, *Team Topologies* (team cognitive load, Conway's law)
- **microservices.io:** C. Richardson, pattern catalog
- **Nx micro-frontends:** nx.dev micro-frontend architecture guide
- **RF-summaries:** secondary summaries of R&F 1st ed. ratings: kb.segersian.com, "Pipeline" (architecture styles notes); C. Bagerbach, "Notes on Fundamentals of Software Architecture" (bagerbach.com); D. Lebrero, "Book notes: Fundamentals of Software Architecture" (danlebrero.com, 2021)
- **modular-monolith refs (Q15, no numeric ratings):** S. Smith, "Introducing Modular Monoliths: The Goldilocks Architecture" (ardalis.com); M. Milanović, "What Is a Modular Monolith?" (techworld-with-milan); encore.dev, "Microservices vs modular monolith" (Shopify example); arXiv 2401.11867, "Modular Monolith: A Software Architecture Trend"; Gandhi, Richards, Ford, *Head First Software Architecture*, O'Reilly 2024, ch. 7
- **spot-check refs:** AWS Solutions Library, "Guidance for Cell-Based Architecture on AWS" (GitHub); arXiv 2505.01821, edge–cloud collaborative computing survey; Netguru serverless computing architecture guide (2026)
