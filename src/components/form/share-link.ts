import type { KnowledgeBase } from "@/modules/knowledge-base/schema";
import { checkInput, type UserInput } from "@/modules/scoring";
import { emptyForm, firstInvalidStep, sanitiseForm, toUserInput, type FormState, type StepId } from "./form-state";

/**
 * Shareable links (FR-37): the answers travel in the URL hash as `#a=<base64url JSON>`. The hash never
 * reaches our server, and the notes are left out because links get pasted into chats (OPEN_QUESTIONS Q29).
 * Ids rather than positions are encoded, so a link keeps working when the KB adds new questions.
 */
const PARAM = "a=";
const LINK_VERSION = 1;

export type SharedLink =
  /** No share link in the hash. */
  | { status: "none" }
  /** Unreadable: cut off, hand-edited or from an unknown link version. */
  | { status: "broken" }
  /** Every answer is valid for the current KB: show the result straight away. */
  | { status: "ok"; form: FormState }
  /** Some answers were dropped or are missing (the KB changed since the link was made): open the form. */
  | { status: "partial"; form: FormState; step: StepId };

const toBase64Url = (text: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(text)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const fromBase64Url = (code: string) =>
  new TextDecoder("utf-8", { fatal: true }).decode(
    Uint8Array.from(atob(code.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)),
  );

/** The hash part (with `#`) for these answers. */
export function encodeShareHash(input: UserInput): string {
  const { attributes, drivers, characteristics } = input;
  return `#${PARAM}${toBase64Url(JSON.stringify({ v: LINK_VERSION, a: attributes, d: drivers, c: characteristics }))}`;
}

const count = (o: unknown) => (typeof o === "object" && o !== null ? Object.keys(o).length : 0);

/** Reads a hash back, cleaning it with the form's KB filter and checking it with the engine's own validator. */
export function decodeShareHash(hash: string, kb: KnowledgeBase): SharedLink {
  const body = hash.replace(/^#/, "");
  if (!body.startsWith(PARAM)) return { status: "none" };
  let data: { v?: unknown; a?: unknown; d?: unknown; c?: unknown };
  try {
    data = JSON.parse(fromBase64Url(body.slice(PARAM.length))) as typeof data;
  } catch {
    return { status: "broken" };
  }
  if (typeof data !== "object" || data === null || data.v !== LINK_VERSION) return { status: "broken" };

  const form = sanitiseForm(
    { ...emptyForm(), attributes: data.a, drivers: data.d, characteristics: data.c } as Partial<FormState>,
    kb,
  );
  const dropped =
    count(data.a) + count(data.d) + count(data.c) !==
    count(form.attributes) + count(form.drivers) + count(form.characteristics);
  if (!dropped && checkInput(toUserInput(form), kb).ok) return { status: "ok", form };
  return { status: "partial", form, step: firstInvalidStep(form, kb) ?? 4 };
}
