import { describe, expect, it, vi } from "vitest";
import { APICallError } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { buildPrompt } from "@/modules/ai/prompt";
import { mockProvider, mockReorderReply } from "@/modules/ai/providers/mock";
import { validateReply } from "@/modules/ai/validate";
import { presets } from "@/components/form/presets";
import { nextMidnight, sdkProvider, toProviderError } from "@/modules/ai/providers/sdk";
import { geminiProvider } from "@/modules/ai/providers/gemini";
import { groqProvider } from "@/modules/ai/providers/groq";
import { ProviderError } from "@/modules/ai/providers/types";
import { exampleB } from "../scoring/fixtures";
import { goldenScenarios } from "../scoring/golden";
import { ctxFor } from "./helpers";

const prompt = buildPrompt(ctxFor(exampleB));
const signal = () => new AbortController().signal;
const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 1, text: 1, reasoning: undefined },
};

function providerReturning(doGenerate: MockLanguageModelV4["doGenerate"]) {
  const model = new MockLanguageModelV4({ doGenerate });
  const p = sdkProvider({
    id: "t",
    label: "T",
    model: "m",
    timeoutMs: 1000,
    languageModel: model,
    dailyResetAt: () => 0,
  });
  return { p, model };
}

const textReply = (text: string) => async () => ({
  content: [{ type: "text" as const, text }],
  finishReason: { unified: "stop" as const, raw: undefined },
  usage,
  warnings: [],
});

const apiError = (statusCode: number, responseBody = "", responseHeaders?: Record<string, string>) =>
  new APICallError({
    message: `HTTP ${statusCode}`,
    url: "https://x",
    requestBodyValues: {},
    statusCode,
    responseBody,
    responseHeaders,
  });

describe("SDK adapter", () => {
  it("returns the parsed object, sends the schema, sets no temperature and no retries", async () => {
    const { p, model } = providerReturning(textReply('{"adjustments":[]}'));
    expect(await p.generate(prompt, signal())).toEqual({ adjustments: [] });
    const call = model.doGenerateCalls[0];
    expect(call.temperature).toBeUndefined();
    expect(call.responseFormat).toMatchObject({ type: "json", schema: prompt.jsonSchema });
    expect(model.doGenerateCalls).toHaveLength(1);
  });

  it("hands non-JSON text back for the repair step; an empty reply is an 'empty' failure", async () => {
    expect(await providerReturning(textReply("Sorry, no.")).p.generate(prompt, signal())).toBe("Sorry, no.");
    await expect(providerReturning(textReply("")).p.generate(prompt, signal())).rejects.toMatchObject({
      kind: "empty",
    });
  });

  it("maps HTTP errors to failure kinds without retrying", async () => {
    const { p, model } = providerReturning(async () => {
      throw apiError(503);
    });
    await expect(p.generate(prompt, signal())).rejects.toMatchObject({ kind: "server" });
    expect(model.doGenerateCalls).toHaveLength(1);
    const s = signal();
    expect(toProviderError(apiError(429, "Rate limit reached on tokens per minute (TPM)"), s).kind).toBe("rate-minute");
    expect(toProviderError(apiError(429, "Rate limit reached on requests per day (RPD)"), s).kind).toBe("rate-daily");
    expect(
      toProviderError(apiError(429, '"quotaId": "GenerateRequestsPerDayPerProjectPerModel-FreeTier"'), s).kind,
    ).toBe("rate-daily");
    expect(toProviderError(apiError(429, "", { "retry-after": "7" }), s).retryAfterMs).toBe(7000);
    expect(toProviderError(apiError(401), s).kind).toBe("rejected");
    expect(toProviderError(new TypeError("fetch failed"), s).kind).toBe("network");
    const aborted = new AbortController();
    aborted.abort();
    expect(toProviderError(new Error("aborted"), aborted.signal).kind).toBe("timeout");
    const own = new ProviderError("empty", "x");
    expect(toProviderError(own, s)).toBe(own);
  });

  it("builds the Gemini and Groq adapters from config, with their timeouts", () => {
    expect(geminiProvider({ apiKey: "k", model: "gemini-3.5-flash-lite" })).toMatchObject({
      id: "gemini",
      timeoutMs: 10_000,
    });
    expect(groqProvider({ apiKey: "k", model: "openai/gpt-oss-120b" })).toMatchObject({ id: "groq", timeoutMs: 8_000 });
  });

  it("finds the next midnight in a time zone", () => {
    // 2026-10-20 23:30 UTC = 16:30 Pacific (PDT) → next Pacific midnight is 2026-10-21 07:00 UTC.
    const now = Date.UTC(2026, 9, 20, 23, 30);
    expect(new Date(nextMidnight("America/Los_Angeles", now)).toISOString()).toBe("2026-10-21T07:00:00.000Z");
    expect(new Date(nextMidnight("UTC", now)).toISOString()).toBe("2026-10-21T00:00:00.000Z");
  });
});

describe("mock provider (AI_MODE=mock)", () => {
  it("plays each fixture", async () => {
    expect(await mockProvider("ok").generate(prompt, signal())).toHaveProperty("explanation");
    expect(await mockProvider("invalid").generate(prompt, signal())).toEqual(expect.any(String));
    await expect(mockProvider("429").generate(prompt, signal())).rejects.toMatchObject({ kind: "rate-minute" });
    await expect(mockProvider("fail").generate(prompt, signal())).rejects.toMatchObject({ kind: "server" });
    const c = new AbortController();
    const slow = mockProvider("slow").generate(prompt, c.signal);
    c.abort();
    await expect(slow).rejects.toMatchObject({ kind: "timeout" });
    expect(vi.isFakeTimers()).toBe(false);
  });
});

describe("mock reorder fixture (AI_MOCK=reorder)", () => {
  it("is a valid reply that moves #2 to the top when the top two are close (golden G10, a tie)", async () => {
    const c = ctxFor(goldenScenarios.find((g) => g.id === "G10")!.input);
    const p = buildPrompt(c);
    const v = validateReply(await mockProvider("reorder").generate(p, signal()), c, p.ids);
    expect(v).toMatchObject({ ok: true, explanation: { topPick: { styleId: p.ids.top[1] } } });
  });

  it("is rejected when the gap is wider than 5 points, so the chain falls back", () => {
    const c = ctxFor(presets.find((p) => p.id === "student")!.input);
    const p = buildPrompt(c);
    expect(validateReply(mockReorderReply(p), c, p.ids).ok).toBe(false);
  });
});
