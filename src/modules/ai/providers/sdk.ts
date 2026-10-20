import "server-only";
import {
  APICallError,
  generateText,
  jsonSchema,
  NoContentGeneratedError,
  NoObjectGeneratedError,
  Output,
  type JSONSchema7,
  type LanguageModel,
} from "ai";
import type { Prompt } from "../prompt";
import { ProviderError, type LlmProvider } from "./types";

type ProviderOptions = Parameters<typeof generateText>[0]["providerOptions"];

export interface SdkProviderOptions {
  id: string;
  label: string;
  model: string;
  timeoutMs: number;
  languageModel: LanguageModel;
  providerOptions?: ProviderOptions;
  dailyResetAt(now: number): number;
}

const DAILY = /per ?day|daily|RPD|TPD/i;

function retryAfterMs(headers: Record<string, string> | undefined): number | undefined {
  const seconds = Number(headers?.["retry-after"]);
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : undefined;
}

/** Maps any SDK or network error to the failure kinds of AI_INTEGRATION §2. Never includes keys. */
export function toProviderError(error: unknown, signal: AbortSignal): ProviderError {
  if (error instanceof ProviderError) return error;
  if (signal.aborted) return new ProviderError("timeout", "timed out");
  if (APICallError.isInstance(error)) {
    const status = error.statusCode ?? 0;
    if (status === 429) {
      const daily = DAILY.test(`${error.message} ${error.responseBody ?? ""}`);
      return new ProviderError(
        daily ? "rate-daily" : "rate-minute",
        `HTTP 429 (${daily ? "daily" : "per-minute"} limit)`,
        retryAfterMs(error.responseHeaders),
      );
    }
    if (status >= 500) return new ProviderError("server", `HTTP ${status}`);
    if (status > 0) return new ProviderError("rejected", `HTTP ${status}`);
    return new ProviderError("network", "network error");
  }
  if (NoContentGeneratedError.isInstance(error)) return new ProviderError("empty", "empty reply");
  return new ProviderError("network", error instanceof Error ? error.name : "unknown error");
}

/**
 * An LlmProvider on top of the Vercel AI SDK. Sends our JSON schema for structured output but does no
 * validation itself (the chain validates, so it can send a repair message). No SDK retries: the chain
 * decides what happens after a failure. No temperature or penalties (Gemini 3.5 Flash-Lite rejects them).
 */
export function sdkProvider(o: SdkProviderOptions): LlmProvider {
  return {
    id: o.id,
    label: o.label,
    model: o.model,
    timeoutMs: o.timeoutMs,
    dailyResetAt: o.dailyResetAt,
    async generate(prompt: Prompt, signal: AbortSignal) {
      try {
        const { output } = await generateText({
          model: o.languageModel,
          system: prompt.system,
          prompt: prompt.user,
          output: Output.object({ schema: jsonSchema(prompt.jsonSchema as JSONSchema7) }),
          maxRetries: 0,
          abortSignal: signal,
          providerOptions: o.providerOptions,
        });
        return output;
      } catch (error) {
        // Text that isn't the JSON we asked for goes back to the chain, which replies with a repair message.
        if (NoObjectGeneratedError.isInstance(error)) {
          if (error.text?.trim()) return error.text;
          throw new ProviderError("empty", "empty reply");
        }
        throw toProviderError(error, signal);
      }
    },
  };
}

/**
 * Next midnight in a time zone (Gemini quotas reset at midnight Pacific). Assumes the day is 24 hours,
 * so it can be an hour off on the two DST-change days; the breaker only needs a rough reset time.
 */
export function nextMidnight(timeZone: string, now: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(new Date(now));
  const part = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const elapsed = ((part("hour") * 60 + part("minute")) * 60 + part("second")) * 1000 + (now % 1000);
  return now - elapsed + 24 * 3600 * 1000;
}
