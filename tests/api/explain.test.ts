import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/explain/route";
import { exampleA } from "../scoring/fixtures";

const post = (body: unknown) =>
  POST(
    new Request("http://localhost/api/explain", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );

afterEach(() => vi.unstubAllEnvs());

describe("POST /api/explain", () => {
  it("returns the 'disabled' AI block when AI_MODE is off or unset", async () => {
    vi.stubEnv("AI_MODE", "off");
    const res = await post({ input: exampleA });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ai: { status: "disabled", adjustments: [] } });
    vi.stubEnv("AI_MODE", "");
    expect((await (await post({ input: exampleA })).json()).ai.status).toBe("disabled");
  });

  it("reports 'unavailable' for other modes until the provider chain exists", async () => {
    vi.stubEnv("AI_MODE", "live");
    expect((await (await post({ input: exampleA })).json()).ai.status).toBe("unavailable");
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
  });
});
