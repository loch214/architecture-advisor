import type { UserInput } from "@/modules/scoring";

export interface Preset {
  id: string;
  title: string;
  description: string;
  input: UserInput;
}

const unsure = {
  "time-to-market": "unsure",
  budget: "unsure",
  "team-size": "unsure",
  experience: "unsure",
  growth: "unsure",
  lifespan: "unsure",
  "change-rate": "unsure",
};

/**
 * Example starting points (UI_UX "Step 0"). Each mirrors a golden scenario so its result is tested:
 * student = G1, startup = G10, saas = new, iot = G4, ticketing = G3, enterprise = G6.
 */
export const presets: Preset[] = [
  {
    id: "student",
    title: "Student project",
    description: "Group of 4–10 beginners, tiny budget, a prototype due this semester.",
    input: {
      attributes: {
        maintainability: "high",
        consistency: "high",
        testability: "medium",
        security: "medium",
        deployability: "medium",
        elasticity: "none",
      },
      drivers: {
        ...unsure,
        "team-size": "4-10",
        experience: "beginner",
        budget: "very-limited",
        "time-to-market": "tight",
        growth: "stable",
        lifespan: "prototype",
      },
      characteristics: {},
      notes: "",
    },
  },
  {
    id: "startup",
    title: "Startup MVP",
    description: "1–3 people, very limited money, and traffic that could spike after a launch.",
    input: {
      attributes: { deployability: "high", scalability: "low" },
      drivers: {
        ...unsure,
        "team-size": "1-3",
        experience: "some",
        budget: "very-limited",
        "time-to-market": "tight",
        growth: "spiky",
      },
      characteristics: {},
      notes: "",
    },
  },
  {
    id: "saas",
    title: "Growing SaaS",
    description: "11–30 developers, clear business areas, fast growth, here for the long run.",
    input: {
      attributes: { scalability: "high", deployability: "high", maintainability: "high", availability: "medium" },
      drivers: {
        ...unsure,
        "team-size": "11-30",
        experience: "some",
        budget: "moderate",
        growth: "rapid",
        lifespan: "5+",
        "change-rate": "constantly",
      },
      characteristics: { "domains-clear": "yes" },
      notes: "",
    },
  },
  {
    id: "iot",
    title: "Event-heavy / IoT",
    description: "Thousands of sensors sending readings; must keep running when parts fail.",
    input: {
      attributes: { availability: "critical", scalability: "high", performance: "high" },
      drivers: {
        ...unsure,
        "team-size": "4-10",
        experience: "experienced",
        budget: "moderate",
        growth: "rapid",
        lifespan: "5+",
      },
      characteristics: { "async-events": true },
      notes: "",
    },
  },
  {
    id: "ticketing",
    title: "High-traffic ticketing",
    description: "Concert ticket sales: huge spikes the moment sales open, experienced team.",
    input: {
      attributes: {
        performance: "critical",
        scalability: "critical",
        elasticity: "critical",
        availability: "high",
        security: "medium",
        maintainability: "medium",
        deployability: "medium",
      },
      drivers: {
        ...unsure,
        "team-size": "11-30",
        experience: "experienced",
        budget: "moderate",
        growth: "spiky",
        lifespan: "1-5",
      },
      characteristics: { "spiky-concurrency": true, "domains-clear": "unsure" },
      notes: "",
    },
  },
  {
    id: "enterprise",
    title: "Enterprise migration",
    description: "Splitting an old monolith for a mid-size business with clear departments.",
    input: {
      attributes: { maintainability: "high", testability: "high", deployability: "medium", consistency: "high" },
      drivers: {
        ...unsure,
        "team-size": "11-30",
        experience: "some",
        budget: "moderate",
        growth: "moderate",
        lifespan: "5+",
        "change-rate": "sometimes",
      },
      characteristics: { "domains-clear": "yes", "legacy-migration": true },
      notes: "",
    },
  },
];
