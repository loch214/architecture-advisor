import type { Mention } from "@/modules/knowledge-base/mentions";
import type { RuleResult, StyleId, UserInput } from "@/modules/scoring";

/**
 * What happened to the AI part of a result (AI_INTEGRATION §10).
 * "disabled": the server runs with AI_MODE=off; "skipped": the user opted out for this request.
 */
export type AiStatus = "ok" | "cached" | "adapted" | "unavailable" | "rate_limited" | "skipped" | "disabled";

export interface AiAdjustment {
  styleId: StyleId;
  delta: number;
  reason: string;
  basis: string;
}

export interface AiExplanation {
  summary: string;
  topPick: { styleId: StyleId; why: string };
  others: { styleId: StyleId; why: string }[];
  cautions: string[];
  notesUsed: string[];
}

/** The AI block of a result. The `ai` module fills it in Phase 5; the rule result never depends on it. */
export interface AiBlock {
  status: AiStatus;
  reuse?: { tier: "identical" | "similar"; fits?: boolean; changes?: string[] };
  provider?: string;
  model?: string;
  latencyMs?: number;
  adjustments: AiAdjustment[];
  explanation?: AiExplanation;
}

export interface FinalScore {
  styleId: StyleId;
  ruleScore: number;
  aiDelta: number;
  finalScore: number;
  rank: number;
}

export interface StyleSnapshot {
  name: string;
  scores: Record<string, number>;
  /** Attributes whose score is a flagged estimate in the KB (shown with a marker in the trade-off table). */
  estimated: string[];
}

/** One self-contained result (ARCHITECTURE §7): enough to re-render it later, even after the KB changes. */
export interface AdvisorResult {
  id: string;
  createdAt: string;
  versions: { app: string; kb: string; engine: string; prompt?: string };
  input: UserInput;
  rules: RuleResult;
  ai: AiBlock;
  final: FinalScore[];
  mentions: Mention[];
  snapshot: { styles: Record<StyleId, StyleSnapshot> };
}
