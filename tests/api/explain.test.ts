import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/explain/route";
import { resetSharedStore } from "@/modules/platform/store";
import { exampleA, exampleB } from "../scoring/fixtures";

const post = (body: unknown, ip = "203.0.113.7") =>
  POST(
    new Request("http://localhost/api/explain", {
      method: "POST",
      headers: { "x-forwarded-for": ip },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );

const aiFor = async (body: unknown, ip?: string) => (await (await post(body, ip)).json()).ai;

beforeEach(() => {
  resetSharedStore();
  vi.spyOn(console, "info").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("POST /api/explain", () => {
  it("returns the 'disabled' AI block when AI_MODE is off or unset", async () => {
    vi.stubEnv("AI_MODE", "off");
    const res = await post({ input: exampleA });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ai: { status: "disabled", adjustments: [] } });
    vi.stubEnv("AI_MODE", "");
    expect((await (await post({ input: exampleA })).json()).ai.status).toBe("disabled");
  });

  it("AI_MODE=mock: ok, then cached for the identical request", async () => {
    vi.stubEnv("AI_MODE", "mock");
    const ai = await aiFor({ input: exampleB });
    expect(ai).toMatchObject({ status: "ok", provider: "Mock AI", promptVersion: "2", adjustments: [] });
    expect(ai.explanation.topPick.styleId).toBe("space-based");
    expect((await aiFor({ input: exampleB })).status).toBe("cached");
  });

  it.each(["invalid", "429", "fail"])(
    "AI_MODE=mock with the %s fixture falls back to 'unavailable'",
    async (fixture) => {
      vi.stubEnv("AI_MODE", "mock");
      vi.stubEnv("AI_MOCK", fixture);
      expect(await aiFor({ input: exampleB })).toEqual({ status: "unavailable", adjustments: [], promptVersion: "2" });
    },
  );

  it("AI_MODE=live without keys reports 'unavailable' and calls nothing", async () => {
    vi.stubEnv("AI_MODE", "live");
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("GROQ_API_KEY", "");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    expect((await aiFor({ input: exampleA })).status).toBe("unavailable");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rate-limits per client: the 11th request in 10 minutes gets 'rate_limited'", async () => {
    vi.stubEnv("AI_MODE", "mock");
    const statuses = [];
    for (let i = 0; i < 11; i++) statuses.push((await aiFor({ input: exampleB })).status);
    expect(statuses.at(-1)).toBe("rate_limited");
    expect(statuses.slice(0, 10)).not.toContain("rate_limited");
    expect((await aiFor({ input: exampleB }, "198.51.100.1")).status).toBe("cached");
  });

  it("ignores scores sent by the client and recomputes the rule result", async () => {
    vi.stubEnv("AI_MODE", "mock");
    const ai = await aiFor({ input: exampleB, rules: { ranked: [{ styleId: "layered", final: 100 }] } });
    expect(ai.explanation.topPick.styleId).toBe("space-based");
  });

  it("never echoes API keys and logs no notes", async () => {
    vi.stubEnv("AI_MODE", "mock");
    vi.stubEnv("GEMINI_API_KEY", "secret-gemini-key-123");
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    const res = await post({ input: { ...exampleB, notes: "private detail about our bank" } });
    expect(await res.text()).not.toContain("secret-gemini-key-123");
    expect(JSON.stringify(log.mock.calls)).not.toContain("private detail");
    expect(log).toHaveBeenCalled();
  });

  it("rejects bodies that aren't JSON or don't hold a valid input, without echoing internals", async () => {
    const notJson = await post("{oops");
    expect(notJson.status).toBe(400);
    const invalid = await post({ input: { ...exampleA, attributes: {} } });
    expect(invalid.status).toBe(400);
    const json = await invalid.json();
    expect(json.issues.map((i: { code: string }) => i.code)).toEqual(["no-priority"]);
    expect(JSON.stringify(json)).not.toMatch(/stack|Error:/);
    expect((await post(null)).status).toBe(400);
    expect((await post({ input: { ...exampleA, notes: "x".repeat(20_000) } })).status).toBe(413);
  });
});
