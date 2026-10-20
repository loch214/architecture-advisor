import type { Effect, Level } from "@/modules/knowledge-base/schema";

export type AttributeId = string;
export type StyleId = string;

export interface UserInput {
  /** Importance levels the user chose. Attributes left out count as "low" (SCORING_ENGINE step 2). */
  attributes: Partial<Record<AttributeId, Level>>;
  /** Driver id → option id ("unsure" is a valid answer). Every driver must be answered. */
  drivers: Record<string, string>;
  /** Characteristic id → boolean, or option id for choice characteristics. Missing ones use their default. */
  characteristics: Record<string, boolean | string>;
  /** Free text for the AI layer only; the rule engine never reads it. */
  notes: string;
}

/** Where a floor came from, and the level that source asks for (several sources can floor one attribute). */
export type FloorSource =
  | { kind: "driver"; driverId: string; optionId: string; label: string; level: Level }
  | { kind: "rule"; ruleId: string; label: string; level: Level };

export interface AppliedFloor {
  attribute: AttributeId;
  level: Level;
  from: FloorSource[];
}

export interface Conflict {
  attribute: AttributeId;
  userLevel: Level;
  usedLevel: Level;
  from: FloorSource[];
  message: string;
}

export interface Warning {
  code: "too-many-critical" | "rule-warning";
  message: string;
  ruleId?: string;
}

export interface FiredRule {
  ruleId: string;
  name: string;
  branch: "when" | "otherwise";
  explanation: string;
  effects: Effect[];
}

export type Fit = "strong" | "good" | "possible" | "weak";

export interface StyleResult {
  styleId: StyleId;
  /** Weighted average of KB scores, normalised to 0–100. */
  base: number;
  /** Sum of rule points, capped at ±modifierCapPerStyle. */
  modifier: number;
  /** Sum of rule points before the cap, so the UI can say when the cap applied. */
  modifierUncapped: number;
  final: number;
  rank: number;
  fit: Fit;
  /** w[a]·x[s][a] / Σw: how much each attribute added to the weighted average (1–5 scale). */
  contributions: Record<AttributeId, number>;
  ruleEffects: { ruleId: string; points: number }[];
  firedRuleIds: string[];
}

export interface RuleResult {
  kbVersion: string;
  engineVersion: string;
  effectiveLevels: Record<AttributeId, Level>;
  effectiveWeights: Record<AttributeId, number>;
  floors: AppliedFloor[];
  ranked: StyleResult[];
  excluded: { styleId: StyleId; ruleIds: string[]; reasons: string[] }[];
  firedRules: FiredRule[];
  notes: { ruleId: string; message: string }[];
  conflicts: Conflict[];
  warnings: Warning[];
  /** The user's highest-weighted attributes (High or above), highest first; trade-off table rows. */
  topAttributes: AttributeId[];
}
