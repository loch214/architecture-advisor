/** Importance levels. Kept free of Zod so client code can use them without shipping the schema library. */
export const LEVELS = ["none", "low", "medium", "high", "critical"] as const;
export type Level = (typeof LEVELS)[number];

export const isLevel = (v: unknown): v is Level => typeof v === "string" && (LEVELS as readonly string[]).includes(v);

export const LEVEL_LABELS: Record<Level, string> = {
  none: "Not needed",
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};
