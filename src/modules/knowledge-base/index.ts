import meta from "./data/meta.json";
import attributes from "./data/attributes.json";
import styles from "./data/styles.json";
import drivers from "./data/drivers.json";
import characteristics from "./data/characteristics.json";
import rules from "./data/rules.json";
import patterns from "./data/patterns.json";
import glossary from "./data/glossary.json";
import { KnowledgeBaseSchema, type KnowledgeBase } from "./schema";

export * from "./schema";
export { findIntegrityProblems, listSources, isUnreviewed } from "./integrity";
export { matchMentions, type Mention } from "./mentions";

export const rawKnowledgeBase = { meta, attributes, styles, drivers, characteristics, rules, patterns, glossary };

/** The validated knowledge base. Parsing at import time means a broken KB fails fast in tests and builds. */
export const kb: KnowledgeBase = KnowledgeBaseSchema.parse(rawKnowledgeBase);

export const levelValue = (level: keyof KnowledgeBase["meta"]["levels"]): number => kb.meta.levels[level];
