import { finalScores, type AiAdjustment, type AiExplanation } from "@/modules/recommendation";
import type { AiContext } from "./context";
import { responseSchema, type AiResponse, type SchemaIds } from "./schema";

export type Validation =
  | { ok: true; response: AiResponse; adjustments: AiAdjustment[]; explanation: AiExplanation }
  | { ok: false; reason: string };

const invalid = (reason: string): Validation => ({ ok: false, reason });

/**
 * Turns a provider reply into a value: objects pass through; strings may hold JSON wrapped in ```json
 * fences or surrounded by prose, so the outermost {...} is parsed.
 */
export function parseReply(raw: unknown): { ok: true; value: unknown } | { ok: false; reason: string } {
  if (raw !== null && typeof raw === "object") return { ok: true, value: raw };
  if (typeof raw !== "string" || raw.trim() === "") return { ok: false, reason: "the reply was empty" };
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return { ok: false, reason: "the reply held no JSON object" };
  try {
    return { ok: true, value: JSON.parse(raw.slice(start, end + 1)) };
  } catch {
    return { ok: false, reason: "the reply was not valid JSON" };
  }
}

/** AI text is rendered as plain text, but tags and markdown links are stripped anyway (AI_INTEGRATION §6.4). */
export function sanitize(text: string): string {
  return text
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<\/?[a-z][^>]*>/gi, "")
    .replace(/!?\[([^\]]*)\]\((?:[^()]|\([^()]*\))*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeDeep<T>(value: T): T {
  if (typeof value === "string") return sanitize(value) as T;
  if (Array.isArray(value)) return value.map(sanitizeDeep) as T;
  if (value !== null && typeof value === "object")
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitizeDeep(v)])) as T;
  return value;
}

const normalise = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

/** Phrases the reason puts in quotes (8+ characters): they must come from the notes. */
const quotedPhrases = (reason: string) =>
  [...reason.matchAll(/["“”]([^"“”]{8,})["“”]/g)].map((m) => normalise(m[1])).filter(Boolean);

const clampDelta = (d: number) => Math.max(-5, Math.min(5, Math.round(d)));

/**
 * Schema + consistency checks of AI_INTEGRATION §4–6, run on every reply (and on every cached reply
 * against the fresh rule result). The server clamps deltas itself and never trusts the AI's numbers.
 */
export function validateReply(raw: unknown, ctx: AiContext, ids: SchemaIds): Validation {
  const parsed = parseReply(raw);
  if (!parsed.ok) return invalid(parsed.reason);

  const result = responseSchema(ids).safeParse(parsed.value);
  if (!result.success) {
    const issue = result.error.issues[0];
    return invalid(`${issue.path.join(".") || "reply"}: ${issue.message}`);
  }
  const response = sanitizeDeep(result.data as AiResponse);
  const { explanation } = response;

  const adjustments: AiAdjustment[] = response.adjustments.map((a) => ({ ...a, delta: clampDelta(a.delta) }));
  const notes = normalise(ctx.notes);
  for (const a of adjustments) {
    if (a.basis !== "notes") continue;
    if (!notes) return invalid(`adjustment for ${a.styleId} cites notes, but there are no notes`);
    const missing = quotedPhrases(a.reason).find((q) => !notes.includes(q));
    if (missing) return invalid(`adjustment for ${a.styleId} quotes "${missing}", which is not in the notes`);
  }

  const first = finalScores(ctx.rules, adjustments, ctx.kb)[0]?.styleId;
  if (explanation.topPick.styleId !== first)
    return invalid(`topPick must be ${first}, the style ranked first after your adjustments`);

  const otherIds = explanation.others.map((o) => o.styleId);
  if (otherIds.includes(explanation.topPick.styleId)) return invalid("others must not include topPick");
  if (new Set(otherIds).size !== otherIds.length) return invalid("others must not repeat a style");

  const mentionIds = explanation.mentions.map((m) => m.id);
  if (new Set(mentionIds).size !== mentionIds.length) return invalid("mentions must not repeat an id");
  const unanswered = ids.mentions.find((id) => !mentionIds.includes(id));
  if (unanswered) return invalid(`mentions must answer ${unanswered}`);

  return {
    ok: true,
    response,
    adjustments,
    explanation: {
      summary: explanation.summary,
      topPick: explanation.topPick,
      others: explanation.others.map((o) => ({ styleId: o.styleId, why: o.whyLower })),
      cautions: explanation.cautions,
      notesUsed: explanation.notesUsed,
      mentions: explanation.mentions,
    },
  };
}
