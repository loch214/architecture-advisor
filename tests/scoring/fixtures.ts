import { kb } from "@/modules/knowledge-base";
import type { UserInput } from "@/modules/scoring";

type Partial2 = {
  attributes?: UserInput["attributes"];
  drivers?: Partial<Record<string, string>>;
  characteristics?: UserInput["characteristics"];
  notes?: string;
};

/** A valid input with every driver "Not sure" and no characteristics, overridden by `p`. */
export function makeInput(p: Partial2 = {}): UserInput {
  const drivers = Object.fromEntries(kb.drivers.map((d) => [d.id, "unsure"]));
  return {
    attributes: { ...p.attributes },
    drivers: { ...drivers, ...(p.drivers as Record<string, string>) },
    characteristics: { ...p.characteristics },
    notes: p.notes ?? "",
  };
}

/** Worked example A (SCORING_ENGINE.md): student group project. */
export const exampleA = makeInput({
  drivers: {
    "system-type": "server",
    "team-size": "4-10",
    experience: "beginner",
    budget: "very-limited",
    "time-to-market": "tight",
    growth: "stable",
    lifespan: "prototype",
  },
  attributes: {
    maintainability: "high",
    consistency: "high",
    testability: "medium",
    security: "medium",
    deployability: "medium",
    elasticity: "none",
  },
});

/** Worked example B (SCORING_ENGINE.md): concert ticketing platform. */
export const exampleB = makeInput({
  drivers: {
    "system-type": "server",
    "team-size": "11-30",
    experience: "experienced",
    budget: "moderate",
    growth: "spiky",
    lifespan: "1-5",
  },
  attributes: {
    performance: "critical",
    scalability: "critical",
    elasticity: "critical",
    availability: "high",
    security: "medium",
    maintainability: "medium",
    deployability: "medium",
  },
  characteristics: { "spiky-concurrency": true, "domains-clear": "unsure" },
});
