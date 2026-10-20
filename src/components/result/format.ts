import type { Fit } from "@/modules/scoring";

/** Scores are stored unrounded; the UI always shows one decimal (SCORING_ENGINE step 5). */
export const fmt = (n: number) => n.toFixed(1);
export const signed = (n: number) => (n > 0 ? `+${fmt(n)}` : n < 0 ? `−${fmt(-n)}` : "0");
export const signedInt = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "0");

export const FIT_LABELS: Record<Fit, string> = {
  strong: "Strong fit",
  good: "Good fit",
  possible: "Possible fit",
  weak: "Weak fit",
};
