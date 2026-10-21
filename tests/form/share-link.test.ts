import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { kb } from "@/modules/knowledge-base";
import { fromInput, toUserInput } from "@/components/form/form-state";
import { presets } from "@/components/form/presets";
import { decodeShareHash, encodeShareHash } from "@/components/form/share-link";

const hashOf = (data: unknown) => `#a=${Buffer.from(JSON.stringify(data)).toString("base64url")}`;
const base = presets[0]!.input;

describe("shareable link (URL hash)", () => {
  it("every preset round-trips to the same answers, without the notes", () => {
    for (const p of presets) {
      const input = { ...p.input, notes: "private details" };
      const link = decodeShareHash(encodeShareHash(input), kb);
      expect(link.status).toBe("ok");
      if (link.status !== "ok") continue;
      expect(toUserInput(link.form)).toEqual({ ...p.input, notes: "" });
      expect(link.form.useAi).toBe(true);
    }
  });

  it("only uses URL-safe characters", () => {
    for (const p of presets) expect(encodeShareHash(p.input)).toMatch(/^#a=[A-Za-z0-9_-]+$/);
  });

  it("ignores hashes that aren't share links", () => {
    expect(decodeShareHash("", kb)).toEqual({ status: "none" });
    expect(decodeShareHash("#ranked-heading", kb)).toEqual({ status: "none" });
  });

  it("reports cut-off, garbled or unknown-version links as broken", () => {
    const good = encodeShareHash(base);
    expect(decodeShareHash(good.slice(0, 20), kb).status).toBe("broken");
    expect(decodeShareHash("#a=!!!", kb).status).toBe("broken");
    expect(decodeShareHash("#a=", kb).status).toBe("broken");
    expect(decodeShareHash(hashOf(null), kb).status).toBe("broken");
    expect(decodeShareHash(hashOf({ v: 2, a: base.attributes, d: base.drivers, c: base.characteristics }), kb)).toEqual(
      { status: "broken" },
    );
  });

  it("drops answers the current KB doesn't know and opens the form instead of a result", () => {
    const link = decodeShareHash(
      hashOf({
        v: 1,
        a: { ...base.attributes, removed: "high" },
        d: base.drivers,
        c: { ...base.characteristics, gone: true },
      }),
      kb,
    );
    expect(link.status).toBe("partial");
    if (link.status !== "partial") return;
    expect(link.form.attributes).toEqual(base.attributes);
    expect(link.form.characteristics).toEqual(base.characteristics);
    expect(link.step).toBe(4);
  });

  it("sends a link missing a question to the step that needs it", () => {
    const [first, ...rest] = Object.keys(base.drivers);
    const drivers = Object.fromEntries(rest.map((id) => [id, base.drivers[id]]));
    const link = decodeShareHash(hashOf({ v: 1, a: base.attributes, d: drivers, c: base.characteristics }), kb);
    expect(link).toMatchObject({ status: "partial", step: 1 });
    if (link.status === "partial") expect(link.form.drivers[first!]).toBeUndefined();
  });

  it("never throws, whatever is in the hash", () => {
    fc.assert(
      fc.property(fc.string(), fc.anything(), (s, data) => {
        expect(() => decodeShareHash(`#a=${s}`, kb)).not.toThrow();
        expect(() => decodeShareHash(hashOf({ v: 1, a: data, d: data, c: data }), kb)).not.toThrow();
      }),
    );
  });

  it("a decoded form gives the same answers as the original", () => {
    const link = decodeShareHash(encodeShareHash(base), kb);
    expect(link.status === "ok" && link.form).toEqual(fromInput({ ...base, notes: "" }));
  });
});
