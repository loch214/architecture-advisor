import { z } from "zod";

export const LEVELS = ["none", "low", "medium", "high", "critical"] as const;
export const LevelSchema = z.enum(LEVELS);
export type Level = z.infer<typeof LevelSchema>;

const Id = z.string().regex(/^[a-z0-9][a-z0-9+.-]*$/, "ids are lower-case kebab-case");

export const SourceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("book"), ref: z.string(), locator: z.string().optional() }).strict(),
  z.object({ kind: z.literal("ref"), ref: z.string(), url: z.url().optional() }).strict(),
  z
    .object({
      kind: z.literal("general"),
      note: z.string().optional(),
      reviewed: z.boolean(),
      // An estimate the KB draft marks as worth a human look; shown on the methodology page.
      flagged: z.boolean().optional(),
    })
    .strict(),
  z.object({ kind: z.literal("design"), note: z.string(), reviewed: z.boolean() }).strict(),
]);
export type Source = z.infer<typeof SourceSchema>;

export const MetaSchema = z
  .object({
    kbVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    scale: z.object({ min: z.literal(1), max: z.literal(5) }),
    levels: z.object({
      none: z.literal(0),
      low: z.literal(1),
      medium: z.literal(2),
      high: z.literal(3),
      critical: z.literal(5),
    }),
    modifierCapPerStyle: z.number().int().positive(),
    maxCriticalSoftLimit: z.number().int().positive(),
    references: z.array(
      z.object({ id: z.string(), citation: z.string(), url: z.url().optional() }).strict(),
    ),
  })
  .strict();

export const AttributeSchema = z
  .object({
    id: Id,
    name: z.string(),
    short: z.string(),
    help: z.string(),
    example: z.string(),
    group: z.enum(["operational", "engineering", "structural", "business"]),
    visibility: z.enum(["default", "advanced"]),
    higherIsBetter: z.literal(true),
    source: SourceSchema,
  })
  .strict();
export type Attribute = z.infer<typeof AttributeSchema>;

export const ScoreValueSchema = z.number().int().min(1).max(5);

export const StyleSchema = z
  .object({
    id: Id,
    name: z.string(),
    category: z.enum(["monolithic", "distributed"]),
    partitioning: z.enum(["technical", "domain", "mixed"]),
    quanta: z.string(),
    summary: z.string(),
    strengths: z.array(z.string()).min(1),
    weaknesses: z.array(z.string()).min(1),
    goodWhen: z.array(z.string()).min(1),
    avoidWhen: z.array(z.string()).min(1),
    patterns: z.array(Id),
    antiPatterns: z.array(Id),
    niche: z.boolean(),
    aliases: z.array(z.string().min(2)),
    combinesWith: z.array(Id),
    source: SourceSchema,
    costLevel: z.number().int().min(1).max(5),
    scores: z.record(z.string(), z.object({ value: ScoreValueSchema, source: SourceSchema }).strict()),
  })
  .strict();
export type Style = z.infer<typeof StyleSchema>;

export const DriverOptionSchema = z
  .object({
    id: Id,
    label: z.string(),
    floors: z.record(z.string(), LevelSchema),
    source: SourceSchema.optional(),
  })
  .strict();

export const DriverSchema = z
  .object({
    id: Id,
    label: z.string(),
    help: z.string(),
    options: z.array(DriverOptionSchema).min(2),
  })
  .strict();
export type Driver = z.infer<typeof DriverSchema>;

const CharacteristicBase = {
  id: Id,
  label: z.string(),
  help: z.string(),
  group: z.enum(["workload", "constraint"]),
  rare: z.boolean().optional(),
  source: SourceSchema,
};
export const CharacteristicSchema = z.discriminatedUnion("type", [
  z.object({ ...CharacteristicBase, type: z.literal("boolean") }).strict(),
  z
    .object({
      ...CharacteristicBase,
      type: z.literal("choice"),
      options: z.array(z.object({ id: Id, label: z.string() }).strict()).min(2),
      default: Id,
    })
    .strict(),
]);
export type Characteristic = z.infer<typeof CharacteristicSchema>;

const Path = z.string().regex(/^(driver|char)\.[a-z0-9-]+$/);
const Scalar = z.union([z.string(), z.boolean()]);

export type Condition =
  | { eq: [string, string | boolean] }
  | { in: [string, (string | boolean)[]] }
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition };

export const ConditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    z.object({ eq: z.tuple([Path, Scalar]) }).strict(),
    z.object({ in: z.tuple([Path, z.array(Scalar).min(1)]) }).strict(),
    z.object({ all: z.array(ConditionSchema).min(1) }).strict(),
    z.object({ any: z.array(ConditionSchema).min(1) }).strict(),
    z.object({ not: ConditionSchema }).strict(),
  ]),
);

export const EffectSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("modify"), style: Id, points: z.number().int() }).strict(),
  z.object({ type: z.literal("exclude"), style: Id }).strict(),
  z.object({ type: z.literal("floor"), attribute: Id, level: LevelSchema }).strict(),
  z.object({ type: z.literal("note"), message: z.string(), warning: z.boolean().optional() }).strict(),
]);
export type Effect = z.infer<typeof EffectSchema>;

export const RuleSchema = z
  .object({
    id: z.string().regex(/^[RN]\d+[a-z]?$/),
    name: z.string(),
    explanation: z.string().min(10),
    when: ConditionSchema,
    effects: z.array(EffectSchema).min(1),
    otherwise: z.array(EffectSchema).min(1).optional(),
    otherwiseExplanation: z.string().min(10).optional(),
    source: SourceSchema,
  })
  .strict()
  .refine((r) => !r.otherwise === !r.otherwiseExplanation, {
    message: "a rule with an otherwise branch needs an otherwiseExplanation (and vice versa)",
  });
export type Rule = z.infer<typeof RuleSchema>;

export const PatternSchema = z
  .object({
    id: Id,
    name: z.string(),
    kind: z.enum(["pattern", "anti-pattern"]),
    problem: z.string(),
    solution: z.string(),
    tradeoffs: z.array(z.string()),
    aliases: z.array(z.string().min(2)),
    source: SourceSchema,
  })
  .strict();
export type Pattern = z.infer<typeof PatternSchema>;

export const GlossaryEntrySchema = z
  .object({
    id: Id,
    name: z.string(),
    kind: z.enum(["technology", "data-architecture", "topic", "classic-style", "approach", "frontend-style"]),
    aliases: z.array(z.string().min(2)).min(1),
    answer: z.string(),
    relatedStyles: z.array(Id),
    source: SourceSchema,
  })
  .strict();
export type GlossaryEntry = z.infer<typeof GlossaryEntrySchema>;

export const KnowledgeBaseSchema = z.object({
  meta: MetaSchema,
  attributes: z.array(AttributeSchema).min(1),
  styles: z.array(StyleSchema).min(1),
  drivers: z.array(DriverSchema).min(1),
  characteristics: z.array(CharacteristicSchema).min(1),
  rules: z.array(RuleSchema).min(1),
  patterns: z.array(PatternSchema),
  glossary: z.array(GlossaryEntrySchema),
});
export type KnowledgeBase = z.infer<typeof KnowledgeBaseSchema>;
