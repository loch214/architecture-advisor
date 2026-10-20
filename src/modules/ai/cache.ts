import { createHash } from "node:crypto";
import { LEVELS, LEVEL_LABELS, type Level } from "@/modules/knowledge-base";
import type { KvStore } from "@/modules/platform/store";
import type { AiContext } from "./context";
import { PROMPT_VERSION, type Reference } from "./prompt";
import type { AiResponse } from "./schema";

/** Cache entries live 30 days; each similarity bucket keeps its 10 most recent (AI_INTEGRATION §7). */
export const CACHE_TTL_MS = 30 * 24 * 3600 * 1000;
export const BUCKET_SIZE = 10;
export const MIN_NOTES_SIMILARITY = 0.6;
export const MAX_DRIVER_CHANGES = 2;

/** What is stored per answer: no raw notes, only their token set (from the redacted notes). */
export interface CacheEntry {
  identicalKey: string;
  levels: Record<string, Level>;
  drivers: Record<string, string>;
  characteristics: Record<string, boolean | string>;
  notesTokens: string[];
  mentionIds: string[];
  response: AiResponse;
  provider: string;
  model: string;
  createdAt: number;
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const sorted = <T>(o: Record<string, T>) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : 1)));

/** Lower-case, single spaces: "whitespace or case" changes in the notes don't make a request new. */
export const normaliseNotes = (notes: string) => notes.toLowerCase().replace(/\s+/g, " ").trim();

const STOP_WORDS = new Set(
  "a an and are as at be but by can do for from has have i if in into is it its me my no not of on or our so that the their them then there these they this to too us was we were will with you your".split(
    " ",
  ),
);

export function notesTokens(notes: string): string[] {
  const words = notes.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  return [...new Set(words.filter((w) => !STOP_WORDS.has(w)))].sort();
}

export function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  const setB = new Set(b);
  const shared = a.filter((t) => setB.has(t)).length;
  return shared / (a.length + b.length - shared);
}

/** T1 key: every structured answer and the normalised notes, plus the KB and prompt versions. */
export function identicalKey(ctx: AiContext): string {
  const { input, rules } = ctx;
  return sha256(
    JSON.stringify([
      rules.kbVersion,
      PROMPT_VERSION,
      sorted(input.attributes),
      sorted(input.drivers),
      sorted(input.characteristics),
      normaliseNotes(ctx.notes),
    ]),
  );
}

/** T2 bucket: same versions, same top 3 in order, same fired rules and exclusions. */
export function bucketKey(ctx: AiContext): string {
  const { rules } = ctx;
  return sha256(
    JSON.stringify([
      rules.kbVersion,
      PROMPT_VERSION,
      ctx.top.slice(0, 3),
      rules.firedRules.map((r) => r.ruleId).sort(),
      rules.excluded.map((e) => e.styleId).sort(),
    ]),
  );
}

export function entryFor(ctx: AiContext, response: AiResponse, provider: string, model: string, now: number) {
  // The reuse verdict belongs to that one request, not to the stored answer.
  const rest = { ...response };
  delete rest.reuse;
  return {
    identicalKey: identicalKey(ctx),
    levels: ctx.rules.effectiveLevels,
    drivers: ctx.input.drivers,
    characteristics: ctx.input.characteristics,
    notesTokens: notesTokens(ctx.notes),
    mentionIds: ctx.mentions.map((m) => m.id).sort(),
    response: rest,
    provider,
    model,
    createdAt: now,
  } satisfies CacheEntry;
}

const rank = (l: Level | undefined) => LEVELS.indexOf(l ?? "low");

/**
 * The similarity test of AI_INTEGRATION §7 (conditions 3–5; the bucket covers 1–2). Returns the
 * differences to tell the AI about, or undefined when the entry is not similar enough.
 */
export function differences(ctx: AiContext, entry: CacheEntry): string[] | undefined {
  const { kb } = ctx;
  const diffs: string[] = [];

  const levels = ctx.rules.effectiveLevels;
  for (const a of new Set([...Object.keys(levels), ...Object.keys(entry.levels)])) {
    const before = entry.levels[a];
    const now = levels[a];
    if (Math.abs(rank(before) - rank(now)) > 1) return undefined;
    if (before !== now)
      diffs.push(`importance of ${a}: ${LEVEL_LABELS[before ?? "low"]} -> ${LEVEL_LABELS[now ?? "low"]}`);
  }

  const driverDiffs = kb.drivers.filter((d) => entry.drivers[d.id] !== ctx.input.drivers[d.id]);
  if (driverDiffs.length > MAX_DRIVER_CHANGES) return undefined;
  for (const d of driverDiffs) {
    const label = (id: string | undefined) => d.options.find((o) => o.id === id)?.label ?? "Not sure";
    diffs.push(`${d.id}: ${label(entry.drivers[d.id])} -> ${label(ctx.input.drivers[d.id])}`);
  }

  for (const c of kb.characteristics) {
    if ((entry.characteristics[c.id] ?? null) !== (ctx.input.characteristics[c.id] ?? null))
      diffs.push(
        `characteristic ${c.id}: ${entry.characteristics[c.id] ?? "unset"} -> ${ctx.input.characteristics[c.id] ?? "unset"}`,
      );
  }

  const mentionIds = ctx.mentions.map((m) => m.id).sort();
  if (mentionIds.join() !== entry.mentionIds.join()) return undefined;
  const tokens = notesTokens(ctx.notes);
  if (jaccard(tokens, entry.notesTokens) < MIN_NOTES_SIMILARITY) return undefined;
  if (tokens.join() !== entry.notesTokens.join()) diffs.push("the notes are worded differently");

  return diffs;
}

export async function findIdentical(store: KvStore, ctx: AiContext): Promise<CacheEntry | undefined> {
  return store.get<CacheEntry>(`ai:t1:${identicalKey(ctx)}`);
}

/** The closest T2 candidate (fewest differences), as a reference for the prompt. */
export async function findSimilar(store: KvStore, ctx: AiContext): Promise<Reference | undefined> {
  let best: Reference | undefined;
  for (const entry of await store.list<CacheEntry>(`ai:t2:${bucketKey(ctx)}`)) {
    const diffs = differences(ctx, entry);
    if (diffs && (!best || diffs.length < best.differences.length))
      best = { response: entry.response, differences: diffs };
  }
  return best;
}

/** Stores a validated answer under both tiers. Only `ok` answers ever get here. */
export async function saveEntry(store: KvStore, entry: CacheEntry, ctx: AiContext): Promise<void> {
  await store.set(`ai:t1:${entry.identicalKey}`, entry, CACHE_TTL_MS);
  await store.pushRecent(`ai:t2:${bucketKey(ctx)}`, entry, BUCKET_SIZE, CACHE_TTL_MS);
}
