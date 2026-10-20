# Scoring Engine

A pure TypeScript module: `score(input, kb) → RuleResult`. "Pure" means no network, no clock, no randomness, no global state. The same input always gives the same output, so it's fully unit-testable and can run in **both** the browser (instant result) and the server (trusted copy used for the AI prompt).

## Pipeline
```
UserInput
  1. validate + normalise (Zod)
  2. resolve effective weights   = max(user level, driver floors, rule floors)
  3. base score per style        = weighted average of KB scores → 0–100
  4. apply rules                 = exclusions + point modifiers (capped ±30)
  5. final score, sort, tie-break
  6. build explanation data      = per-attribute contributions, fired rules, conflicts
→ RuleResult
```

## Step 2: Effective weights
Level → number: `none 0, low 1, medium 2, high 3, critical 5`.

Critical is 5, not 4, on purpose: it makes a must-have clearly outweigh several "high" items. That reflects Richards & Ford's advice to drive design from a short top-3 list.

```
w[a] = levelValue( max(userLevel[a], maxFloorFromDrivers[a], maxFloorFromRules[a]) )
```
- Unset attributes default to `low` (1). Every attribute counts a little, so ties break sensibly.
- If a floor raises a level the user **explicitly** set lower, we record an **input conflict** (floors that raise an attribute the user left unset are recorded in `floors[]` but aren't conflicts, otherwise every default "Low" would be one), e.g. "You marked scalability Low but expect rapid growth. We used Medium." The user sees it and can change the driver.

## Step 3: Base score
For style `s`, with KB score `x[s][a]` in 1–5:

```
avg[s]  = Σa w[a]·x[s][a] / Σa w[a]          (weighted average, still 1–5)
base[s] = (avg[s] − 1) / 4 × 100             (normalised to 0–100)
```
Why a weighted average (not a plain sum): it's independent of how many attributes the user rated, and it stays on a scale people understand. Normalising to 0–100 makes rule points and AI adjustments easy to reason about ("+5 points").

## Step 4: Rules
For each rule in `rules.json` (fixed order by id):
- If `when` is true, apply `effects`. If false and `otherwise` exists, apply `otherwise`.
- `exclude`: style is removed from the ranking and listed under "Not recommended because…" with the rule's explanation.
- `modify`: add points to `mod[s]`.
- `floor`: applied in step 2 (rules are evaluated for floors first, then for modifiers).

```
mod[s] = clamp(Σ points for s, −30, +30)
```
The cap stops rules from overwhelming the user's own priorities. Rules can reorder close styles, but they can't hide a style that strongly matches every priority.

## Step 5: Final score and ordering
```
final[s] = clamp(base[s] + mod[s], 0, 100)    // rounded to 1 decimal for display only
```
Sort by: `final` desc → `base` desc → `simplicity` score desc (prefer the simpler option on ties, the "least-worst" spirit) → `id` asc. Fully deterministic.

**Fit labels** (for UI): ≥ 75 strong fit · 60–74.9 good fit · 45–59.9 possible fit · < 45 weak fit. (`DESIGN`, tune during testing.)

## Step 6: Explanation data (returned with every result)
- `contributions[s][a] = w[a]·x[s][a] / Σw`: how much each attribute added. Powers "Why this score" bars.
- `firedRules[]` with id, explanation, and effect per style.
- `conflicts[]` (step 2) and `warnings[]`, e.g. "More than 3 Critical attributes: priorities may be unclear".
- `topAttributes[]`: the user's highest-weighted attributes. Used for the trade-off table columns.

## Input validation
- At least **one** attribute at High or Critical (otherwise nothing to rank on). Form blocks submit with a friendly message.
- More than 3 Critical: warning, not error.
- All drivers required, but "Not sure" is a valid answer.
- Free text: max 1,000 characters. **Not used by the rule engine at all**, only by the AI.

## Types (as implemented in `src/modules/scoring/types.ts`)
```ts
interface UserInput {
  attributes: Partial<Record<AttributeId, Level>>; // unset = "low"; set = user's explicit choice
  drivers: Record<DriverId, string>;              // every driver required; "unsure" is valid
  characteristics: Record<CharId, boolean | string>; // missing → false / KB default
  notes: string;                                  // AI only; the engine never reads it
}
interface StyleResult {
  styleId; base; modifier /* capped */; modifierUncapped; final;
  rank; fit: "strong" | "good" | "possible" | "weak";
  contributions: Record<AttributeId, number>;     // w·x/Σw, sums to the weighted average
  ruleEffects: { ruleId: string; points: number }[];
  firedRuleIds: string[];
}
interface RuleResult {
  kbVersion; engineVersion;
  effectiveLevels: Record<AttributeId, Level>; effectiveWeights: Record<AttributeId, number>;
  floors: { attribute; level; from: FloorSource[] }[];       // driver or rule that set each floor
  ranked: StyleResult[];
  excluded: { styleId; ruleIds: string[]; reasons: string[] }[];
  firedRules: { ruleId; name; branch: "when" | "otherwise"; explanation; effects }[];
  notes: { ruleId; message }[];                                // N1, N2 (no score change)
  conflicts: { attribute; userLevel; usedLevel; from; message }[];
  warnings: { code: "too-many-critical" | "rule-warning"; message; ruleId? }[]; // N3 is a rule warning
  topAttributes: AttributeId[];   // effective weight ≥ High, highest first, ties in KB order
}
```
Implementation notes: base and final are rounded to 6 decimals internally so equal sums tie exactly (display rounds to 1). Rules run in `rules.json` order. Rules with an `otherwise` branch carry an `otherwiseExplanation` shown when that branch fires. `score()` validates first and throws `InvalidInputError`; `checkInput()` returns the issues for the form.

---

## Worked example A: student group project
**Input:** team 4–10, experience Beginner, budget Very limited, time to market Tight, growth Small & stable, lifespan Prototype. User: maintainability High, consistency High, testability Medium, security Medium, rest Low; elasticity Not needed. Characteristics: none selected.

**Effective weights** (after floors: Very limited budget → cost **Critical**; Prototype → simplicity High; Beginner → simplicity High; Tight deadline → simplicity Medium):

| simp | mod | main | test | depl | evol | perf | scal | elas | avail | cost | sec | cons | Σ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 3 | 1 | 3 | 2 | 2* | 1 | 1 | 1 | 0 | 1 | 5 | 2 | 3 | 25 |

\* user set deployability Medium.

**Modular monolith base** (book ratings 5,2,2,2,2,2,3,1,1,1, cost 5, sec 3, cons 5):
(3·5 + 1·2 + 3·2 + 2·2 + 2·2 + 1·2 + 1·3 + 1·1 + 0·1 + 1·1 + 5·5 + 2·3 + 3·5) / 25 = 84 / 25 = 3.36 → (3.36 − 1)/4·100 = **59.0**

**Rules fired:** R1 (Beginner), R18 (stable growth + prototype → new system, direction uncertain), and the "otherwise" penalties of R6/R7/R8/R14/R16/R17 (no niche characteristics selected).

| Rank | Style | Base | Rules | Final |
|---|---|---|---|---|
| 1 | Modular monolith | 59.0 | +10 (R18) | **69.0** |
| 2 | Layered | 52.0 | +5 (R18) | 57.0 |
| 3 | Service-based | 66.0 | −10 (R1) | 56.0 |
| 4 | Event-driven | 53.0 | −5 (R1) | 48.0 |
| 5 | Pipeline | 62.0 | −15 (R7) | 47.0 |
| 6 | Microkernel | 62.0 | −15 (R8) | 47.0 (tie → pipeline wins on simplicity) |
| 7 | Serverless | 48.0 | −10 (R1) | 38.0 |
| 8 | Microservices | 52.0 | −15 (R1) | 37.0 |
| 9 | Cell-based | 44.0 | −25 (R1, R14) | 19.0 |
| 10 | Space-based | 35.0 | −20 (R1, R6) | 15.0 |
| 11 | Peer-to-peer | 38.0 | −30 (cap) | 8.0 |
| 12 | SOA | 18.0 | −10 (R1) | 8.0 |
| 13 | Edge–cloud | 31.0 | −30 (cap) | 1.0 |

Reads as expected: modular monolith for a beginner team on a budget, with service-based as the "when you outgrow it" option. Note that service-based has the *highest base score* (the book rates it well on most attributes). The rules for team maturity and "start simple" are what put the monolith first, and the result page shows exactly that.

## Worked example B: concert ticketing platform
**Input:** team 11–30, experience Experienced, budget Moderate, growth Unpredictable spikes, lifespan 1–5 yrs. User: performance, scalability, elasticity Critical; availability High; security, maintainability, deployability Medium; rest Low. Characteristics: spiky-concurrency ✔, domains-clear = not sure.

Effective Σw = 32. Rules fired: R6 (+15 space-based, +5 serverless) and the "otherwise" penalties of R7/R8/R14/R16/R17.

| Rank | Style | Base | Rules | Final |
|---|---|---|---|---|
| 1 | Space-based | 65.6 | +15 | **80.6** |
| 2 | Serverless | 65.6 | +5 | 70.6 |
| 3 | Microservices | 69.5 | 0 | 69.5 |
| 4 | Event-driven | 68.8 | 0 | 68.8 |
| 5 | Cell-based | 70.3 | −10 | 60.3 |
| 6 | Service-based | 53.1 | 0 | 53.1 |
| … | P2P 38.6, SOA 35.9, Edge 34.7, Modular monolith 29.7, Layered 24.2, Microkernel 19.4, Pipeline 14.7 | | | |

**AI layer on top (illustration):** notes say *"Order flow must be fully auditable and we already run Kafka."* The AI may return `event-driven +4` ("existing Kafka skills; an event log supports auditability"). Event-driven → 72.8, moving from #4 to #2. Space-based stays #1 because a 10-point lead can't be overturned by a ±5 adjustment. The UI shows *Event-driven: rules 68.8, AI +4, final 72.8*. That's a small, visible, justified change, which is what the hybrid design is for.

## Determinism and safety properties (tested)
1. Same input ⇒ identical output (deep-equal), across browser and server.
2. Raising an attribute's weight never lowers the score of a style whose score on that attribute is above its current average.
3. A style's final score never moves more than 30 points from its base because of rules.
4. Excluded styles never appear in `ranked`.
5. Output contains every non-excluded style exactly once.
