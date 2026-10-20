import type { KnowledgeBase } from "./schema";

export interface Mention {
  kind: "style" | "pattern" | "anti-pattern" | "glossary";
  id: string;
  name: string;
  /** The alias text that matched, as written in the KB. */
  matched: string;
  /** One or two lines from the KB that answer "what is this, and does it matter here?". */
  answer: string;
  relatedStyles: string[];
}

const MAX_MENTIONS = 4;

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Deterministic alias match of free-text notes against the KB (KNOWLEDGE_BASE_SCHEMA "Alias matching"):
 * lower-case, word-boundary match; longer aliases are tried first and claim their text so a shorter
 * alias inside them ("monolith" in "modular monolith") doesn't match twice; max 4 items, in order of
 * first appearance in the notes.
 */
export function matchMentions(notes: string, kb: KnowledgeBase): Mention[] {
  const text = notes.toLowerCase();
  if (!text.trim()) return [];

  const candidates: { alias: string; mention: Omit<Mention, "matched"> }[] = [];
  for (const s of kb.styles) {
    for (const alias of s.aliases) {
      candidates.push({ alias, mention: { kind: "style", id: s.id, name: s.name, answer: s.summary, relatedStyles: [s.id] } });
    }
  }
  for (const p of kb.patterns) {
    const answer = `${p.kind === "anti-pattern" ? "Anti-pattern" : "Pattern"}, not a style: ${p.problem} ${p.solution}`;
    const relatedStyles = kb.styles.filter((s) => s.patterns.includes(p.id) || s.antiPatterns.includes(p.id)).map((s) => s.id);
    for (const alias of p.aliases) {
      candidates.push({ alias, mention: { kind: p.kind, id: p.id, name: p.name, answer, relatedStyles } });
    }
  }
  for (const g of kb.glossary) {
    for (const alias of g.aliases) {
      candidates.push({ alias, mention: { kind: "glossary", id: g.id, name: g.name, answer: g.answer, relatedStyles: g.relatedStyles } });
    }
  }
  // Longest alias first; ties broken alphabetically so the result never depends on file order.
  candidates.sort((a, b) => b.alias.length - a.alias.length || a.alias.localeCompare(b.alias));

  const claimed: boolean[] = new Array(text.length).fill(false);
  const found = new Map<string, Mention & { position: number }>();
  for (const { alias, mention } of candidates) {
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(alias.toLowerCase())}(?![\\p{L}\\p{N}])`, "gu");
    for (const m of text.matchAll(re)) {
      const start = m.index;
      const end = start + m[0].length;
      if (claimed.slice(start, end).some(Boolean)) continue;
      for (let i = start; i < end; i++) claimed[i] = true;
      const key = `${mention.kind}:${mention.id}`;
      const existing = found.get(key);
      if (!existing || start < existing.position) found.set(key, { ...mention, matched: alias, position: start });
    }
  }
  return [...found.values()]
    .sort((a, b) => a.position - b.position)
    .slice(0, MAX_MENTIONS)
    .map(({ position: _position, ...m }) => m);
}
