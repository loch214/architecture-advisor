import type { KnowledgeBase, Source, Effect } from "./schema";

/**
 * Cross-file checks Zod can't express on its own: every reference points at something real,
 * and derived values (cost) agree with their source of truth (costLevel).
 */
export function findIntegrityProblems(kb: KnowledgeBase): string[] {
  const problems: string[] = [];
  const attributeIds = new Set(kb.attributes.map((a) => a.id));
  const styleIds = new Set(kb.styles.map((s) => s.id));
  const patternIds = new Set(kb.patterns.map((p) => p.id));
  const driverOptions = new Map(kb.drivers.map((d) => [d.id, new Set(d.options.map((o) => o.id))]));
  const charValues = new Map(
    kb.characteristics.map((c) => [
      c.id,
      c.type === "boolean"
        ? new Set<string | boolean>([true, false])
        : new Set<string | boolean>(c.options.map((o) => o.id)),
    ]),
  );

  const duplicates = (label: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) problems.push(`duplicate ${label} id "${id}"`);
      seen.add(id);
    }
  };
  duplicates(
    "attribute",
    kb.attributes.map((a) => a.id),
  );
  duplicates(
    "style",
    kb.styles.map((s) => s.id),
  );
  duplicates(
    "driver",
    kb.drivers.map((d) => d.id),
  );
  duplicates(
    "characteristic",
    kb.characteristics.map((c) => c.id),
  );
  duplicates(
    "rule",
    kb.rules.map((r) => r.id),
  );
  duplicates(
    "pattern",
    kb.patterns.map((p) => p.id),
  );
  duplicates(
    "glossary",
    kb.glossary.map((g) => g.id),
  );

  for (const style of kb.styles) {
    for (const a of attributeIds) {
      if (!style.scores[a]) problems.push(`${style.id}: missing score for "${a}"`);
    }
    for (const a of Object.keys(style.scores)) {
      if (!attributeIds.has(a)) problems.push(`${style.id}: score for unknown attribute "${a}"`);
    }
    if (style.scores.cost && style.scores.cost.value !== 6 - style.costLevel) {
      problems.push(
        `${style.id}: cost score ${style.scores.cost.value} must equal 6 − costLevel (${6 - style.costLevel})`,
      );
    }
    for (const p of style.patterns) {
      const pattern = kb.patterns.find((x) => x.id === p);
      if (!pattern) problems.push(`${style.id}: unknown pattern "${p}"`);
      else if (pattern.kind !== "pattern")
        problems.push(`${style.id}: "${p}" is listed as a pattern but is an anti-pattern`);
    }
    for (const p of style.antiPatterns) {
      const pattern = kb.patterns.find((x) => x.id === p);
      if (!pattern) problems.push(`${style.id}: unknown anti-pattern "${p}"`);
      else if (pattern.kind !== "anti-pattern")
        problems.push(`${style.id}: "${p}" is listed as an anti-pattern but is a pattern`);
    }
    for (const c of style.combinesWith) {
      if (!styleIds.has(c)) problems.push(`${style.id}: combinesWith unknown style "${c}"`);
    }
  }

  for (const driver of kb.drivers) {
    if (!driver.options.some((o) => o.id === "unsure"))
      problems.push(`driver ${driver.id}: needs a "Not sure" (unsure) option`);
    for (const option of driver.options) {
      for (const a of Object.keys(option.floors)) {
        if (!attributeIds.has(a)) problems.push(`driver ${driver.id}.${option.id}: floor on unknown attribute "${a}"`);
      }
      if (Object.keys(option.floors).length > 0 && !option.source) {
        problems.push(`driver ${driver.id}.${option.id}: floors need a source`);
      }
    }
  }

  for (const c of kb.characteristics) {
    if (c.type === "choice" && !c.options.some((o) => o.id === c.default)) {
      problems.push(`characteristic ${c.id}: default "${c.default}" is not an option`);
    }
  }

  const checkEffect = (ruleId: string, e: Effect) => {
    if ((e.type === "modify" || e.type === "exclude") && !styleIds.has(e.style)) {
      problems.push(`${ruleId}: unknown style "${e.style}"`);
    }
    if (e.type === "floor" && !attributeIds.has(e.attribute))
      problems.push(`${ruleId}: unknown attribute "${e.attribute}"`);
  };
  const checkPath = (ruleId: string, path: string, values: (string | boolean)[]) => {
    const [scope, id] = path.split(".") as [string, string];
    const allowed = scope === "driver" ? driverOptions.get(id) : charValues.get(id);
    if (!allowed) {
      problems.push(`${ruleId}: unknown path "${path}"`);
      return;
    }
    for (const v of values)
      if (!allowed.has(v)) problems.push(`${ruleId}: "${String(v)}" is not a valid value for ${path}`);
  };
  type Cond = KnowledgeBase["rules"][number]["when"];
  const walk = (ruleId: string, c: Cond) => {
    if ("eq" in c) checkPath(ruleId, c.eq[0], [c.eq[1]]);
    else if ("in" in c) checkPath(ruleId, c.in[0], c.in[1]);
    else if ("all" in c) c.all.forEach((x) => walk(ruleId, x));
    else if ("any" in c) c.any.forEach((x) => walk(ruleId, x));
    else walk(ruleId, c.not);
  };
  for (const rule of kb.rules) {
    walk(rule.id, rule.when);
    rule.effects.forEach((e) => checkEffect(rule.id, e));
    rule.otherwise?.forEach((e) => checkEffect(rule.id, e));
    if (rule.otherwise?.some((e) => e.type === "floor")) {
      problems.push(`${rule.id}: floors in an otherwise branch are not supported`);
    }
  }

  for (const g of kb.glossary) {
    for (const s of g.relatedStyles) if (!styleIds.has(s)) problems.push(`glossary ${g.id}: unknown style "${s}"`);
  }

  for (const id of patternIds) if (styleIds.has(id)) problems.push(`"${id}" is both a style and a pattern id`);
  return problems;
}

/** Every source in the KB, with a readable location, for the release gate and the methodology page. */
export function listSources(kb: KnowledgeBase): { where: string; source: Source }[] {
  const out: { where: string; source: Source }[] = [];
  kb.attributes.forEach((a) => out.push({ where: `attribute ${a.id}`, source: a.source }));
  kb.styles.forEach((s) => {
    out.push({ where: `style ${s.id}`, source: s.source });
    Object.entries(s.scores).forEach(([a, sc]) => out.push({ where: `${s.id}.${a}`, source: sc.source }));
  });
  kb.drivers.forEach((d) =>
    d.options.forEach((o) => o.source && out.push({ where: `driver ${d.id}.${o.id}`, source: o.source })),
  );
  kb.characteristics.forEach((c) => out.push({ where: `characteristic ${c.id}`, source: c.source }));
  kb.rules.forEach((r) => out.push({ where: `rule ${r.id}`, source: r.source }));
  kb.patterns.forEach((p) => out.push({ where: `pattern ${p.id}`, source: p.source }));
  kb.glossary.forEach((g) => out.push({ where: `glossary ${g.id}`, source: g.source }));
  return out;
}

export function isUnreviewed(source: Source): boolean {
  return (source.kind === "general" || source.kind === "design") && !source.reviewed;
}
