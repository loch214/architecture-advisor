import "server-only";

export type AiMode = "off" | "mock" | "live";

/** AI_MODE=off|mock|live (AI_INTEGRATION §11). Anything else, including unset, means off. */
export function aiMode(): AiMode {
  const v = process.env.AI_MODE;
  return v === "mock" || v === "live" ? v : "off";
}
