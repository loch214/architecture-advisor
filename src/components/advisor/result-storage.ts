import type { AdvisorResult } from "@/modules/recommendation";

const KEY = "architecture-advisor:result";

/** Keeps the last result so a refresh or an error never loses it (UI_UX "States"). */
export function saveResult(r: AdvisorResult) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(r));
  } catch {
    // Storage blocked or full: the result stays in memory only.
  }
}

/** Returns the stored result if it still looks like one. It renders from its own KB snapshot, so KB updates don't break it. */
export function loadSavedResult(): AdvisorResult | undefined {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return undefined;
    const r = JSON.parse(raw) as AdvisorResult;
    return r && Array.isArray(r.final) && r.final.length > 0 && r.rules && r.snapshot ? r : undefined;
  } catch {
    return undefined;
  }
}

export function clearSavedResult() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}
