import { z } from "zod";

/** Ids the AI may use in one request: built per request from the rule result (AI_INTEGRATION §4, §6b). */
export interface SchemaIds {
  /** Top 5 style ids from the rule result, rule rank order. */
  top: string[];
  /** Ids of KB items matched in the notes (empty when nothing matched). */
  mentions: string[];
  /** T2 only: the response must say whether the reference answer still fits. */
  withReuse: boolean;
}

const oneOf = (ids: string[]) => z.enum(ids as [string, ...string[]]);

/**
 * The response schema for one request (AI_INTEGRATION §4). Style ids are an enum of the top 5, so the
 * AI can't name an excluded or unknown style. Unknown keys are stripped.
 */
export function responseSchema({ top, mentions, withReuse }: SchemaIds) {
  const styleId = oneOf(top);
  // An enum needs at least one value; with no matched mentions the array must simply be empty.
  const mentionId = mentions.length > 0 ? oneOf(mentions) : z.string();
  const schema = z.object({
    adjustments: z
      .array(
        z.object({
          styleId,
          delta: z
            .number()
            .int()
            .min(-5)
            .max(5)
            .refine((d) => d !== 0, "delta must not be 0"),
          reason: z.string().min(10).max(240),
          basis: z.enum(["notes", "inputs"]),
        }),
      )
      .max(3)
      .refine((a) => new Set(a.map((x) => x.styleId)).size === a.length, "each style may be adjusted once"),
    explanation: z.object({
      summary: z.string().min(1).max(700),
      topPick: z.object({ styleId, why: z.string().min(1).max(600) }),
      others: z.array(z.object({ styleId, whyLower: z.string().min(1).max(300) })).max(4),
      cautions: z.array(z.string().max(240)).max(3),
      notesUsed: z.array(z.string().max(160)).max(3),
      mentions: z
        .array(z.object({ id: mentionId, answer: z.string().min(1).max(300) }))
        .max(mentions.length > 0 ? 4 : 0),
    }),
  });
  return withReuse
    ? schema.extend({ reuse: z.object({ fits: z.boolean(), changes: z.array(z.string().max(240)).max(5) }) })
    : schema;
}

export type AiResponse = z.infer<ReturnType<typeof responseSchema>> & {
  reuse?: { fits: boolean; changes: string[] };
};

/** The same schema as JSON Schema, sent to providers that support structured output. */
export function responseJsonSchema(ids: SchemaIds): Record<string, unknown> {
  return z.toJSONSchema(responseSchema(ids), { unrepresentable: "any" }) as Record<string, unknown>;
}
