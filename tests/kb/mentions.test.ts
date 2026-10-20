import { describe, expect, it } from "vitest";
import { kb, matchMentions } from "@/modules/knowledge-base";

const ids = (notes: string) => matchMentions(notes, kb).map((m) => `${m.kind}:${m.id}`);

describe("glossary / alias matching", () => {
  it("returns nothing for empty notes", () => {
    expect(matchMentions("   ", kb)).toEqual([]);
  });

  it("matches styles, patterns, anti-patterns and glossary items case-insensitively", () => {
    expect(ids("We want CQRS on Kubernetes and to avoid a Big Ball of Mud. Maybe microservices?")).toEqual([
      "pattern:cqrs",
      "glossary:kubernetes",
      "anti-pattern:big-ball-of-mud",
      "style:microservices",
    ]);
  });

  it("uses word boundaries", () => {
    expect(ids("our drag-and-drop editor")).toEqual([]); // "rag" inside "drag" must not match
    expect(ids("a RAG chatbot")).toEqual(["glossary:ai-apps"]);
  });

  it("lets the longest alias win over a shorter one inside it", () => {
    expect(ids("a modular monolith")).toEqual(["style:modular-monolith"]);
    expect(ids("lambda architecture for analytics")).toEqual(["glossary:lambda-kappa"]);
  });

  it("reports each item once and keeps at most 4, in order of appearance", () => {
    const m = matchMentions("kafka, saga, cqrs, outbox, kubernetes, kafka again", kb);
    expect(m.map((x) => x.id)).toEqual(["event-driven", "saga", "cqrs", "outbox"]);
    expect(m[0]!.matched).toBe("kafka");
  });

  it("links patterns to the styles that use them", () => {
    const [saga] = matchMentions("saga", kb);
    expect(saga!.relatedStyles).toEqual(expect.arrayContaining(["event-driven", "microservices"]));
    expect(saga!.answer).toMatch(/^Pattern, not a style/);
  });

  it("is deterministic", () => {
    const notes = "Firebase or Supabase? Hexagonal inside, maybe DDD";
    expect(matchMentions(notes, kb)).toEqual(matchMentions(notes, kb));
  });
});
