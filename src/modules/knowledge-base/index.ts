import meta from "./data/meta.json";
import attributes from "./data/attributes.json";
import styles from "./data/styles.json";
import drivers from "./data/drivers.json";
import characteristics from "./data/characteristics.json";
import rules from "./data/rules.json";
import patterns from "./data/patterns.json";
import glossary from "./data/glossary.json";
import type { KnowledgeBase } from "./schema";

// Types only: the Zod schemas stay out of the browser bundle. Import them from "./schema" where needed.
export type * from "./schema";
export * from "./levels";
export { findIntegrityProblems, listSources, isUnreviewed } from "./integrity";
export { matchMentions, type Mention } from "./mentions";

export const rawKnowledgeBase = { meta, attributes, styles, drivers, characteristics, rules, patterns, glossary };

/**
 * The knowledge base. It isn't parsed here, so Zod never reaches the browser: `assertValidKnowledgeBase()`
 * runs in `next.config.ts` (a broken KB fails the build) and the KB tests check the same schema.
 */
export const kb = rawKnowledgeBase as unknown as KnowledgeBase;

export const levelValue = (level: keyof KnowledgeBase["meta"]["levels"]): number => kb.meta.levels[level];
