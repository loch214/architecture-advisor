import { matchMentions, type KnowledgeBase, type Mention } from "@/modules/knowledge-base";
import { MAX_NOTES_LENGTH, score, type RuleResult, type UserInput } from "@/modules/scoring";
import { redact } from "./redact";

/** How many rule-ranked styles the AI sees and may adjust (AI_INTEGRATION §3). */
export const TOP_N = 5;

/** Everything one AI request is about, computed on the server from the validated input. */
export interface AiContext {
  kb: KnowledgeBase;
  input: UserInput;
  /** Recomputed here: the server never trusts scores sent by the browser (AI_INTEGRATION §9). */
  rules: RuleResult;
  /** KB items matched in the notes (deterministic, AI_INTEGRATION §6b). */
  mentions: Mention[];
  /** Notes as sent to the AI: trimmed, capped and redacted. */
  notes: string;
  /** Top style ids in rule order. */
  top: string[];
}

export function makeContext(input: UserInput, kb: KnowledgeBase): AiContext {
  const rules = score(input, kb);
  return {
    kb,
    input,
    rules,
    mentions: matchMentions(input.notes, kb),
    notes: redact(input.notes.trim().slice(0, MAX_NOTES_LENGTH)),
    top: rules.ranked.slice(0, TOP_N).map((s) => s.styleId),
  };
}
