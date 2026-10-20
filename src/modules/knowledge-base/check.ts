import { rawKnowledgeBase } from "./index";
import { findIntegrityProblems } from "./integrity";
import { KnowledgeBaseSchema } from "./schema";

/** Throws if the KB JSON breaks its schema or its cross-file integrity rules. Used at build time. */
export function assertValidKnowledgeBase(): void {
  const parsed = KnowledgeBaseSchema.parse(rawKnowledgeBase);
  const problems = findIntegrityProblems(parsed);
  if (problems.length > 0) throw new Error(`Knowledge base integrity problems:\n- ${problems.join("\n- ")}`);
}
