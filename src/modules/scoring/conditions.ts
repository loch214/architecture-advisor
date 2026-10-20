import type { Condition } from "@/modules/knowledge-base/schema";

type Value = string | boolean | undefined;

function lookup(path: string, drivers: Record<string, string>, chars: Record<string, string | boolean>): Value {
  const [scope, id] = path.split(".") as ["driver" | "char", string];
  return scope === "driver" ? drivers[id] : chars[id];
}

/** Interprets the tiny rule condition language (eq, in, all, any, not) over normalised input. */
export function evaluateCondition(
  c: Condition,
  drivers: Record<string, string>,
  chars: Record<string, string | boolean>,
): boolean {
  if ("eq" in c) return lookup(c.eq[0], drivers, chars) === c.eq[1];
  if ("in" in c) {
    const v = lookup(c.in[0], drivers, chars);
    return v !== undefined && c.in[1].includes(v);
  }
  if ("all" in c) return c.all.every((x) => evaluateCondition(x, drivers, chars));
  if ("any" in c) return c.any.some((x) => evaluateCondition(x, drivers, chars));
  return !evaluateCondition(c.not, drivers, chars);
}
