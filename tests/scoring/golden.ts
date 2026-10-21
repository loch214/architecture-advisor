import type { UserInput } from "@/modules/scoring";
import { exampleA, exampleB, makeInput } from "./fixtures";

export interface GoldenScenario {
  id: string;
  title: string;
  input: UserInput;
  /** Any of these may be #1. Empty means "no fixed pick". */
  expectedTop: string[];
}

/**
 * The golden scenarios from TESTING_STRATEGY.md §2. They encode domain judgement:
 * if a KB or rule change breaks one, stop and decide whether the change or the expectation is wrong.
 */
/** The owner's IDE scenario (2026-10-21), as exported from the live app before the new questions existed. */
const ideDrivers = {
  "time-to-market": "relaxed",
  budget: "moderate",
  "team-size": "4-10",
  experience: "some",
  growth: "moderate",
  lifespan: "5+",
  "change-rate": "sometimes",
};
const ideAttributes = {
  consistency: "high",
  modularity: "high",
  evolvability: "critical",
  deployability: "medium",
  testability: "high",
  maintainability: "high",
  security: "medium",
  availability: "critical",
  performance: "high",
} as const;
/** The owner's hospital management system (2026-10-21): one back end, a staff web app and a mobile view for patients. */
const hospitalDrivers = {
  "time-to-market": "tight",
  budget: "moderate",
  "team-size": "4-10",
  experience: "some",
  growth: "moderate",
  lifespan: "5+",
  "change-rate": "rarely",
};
const hospitalAttributes = {
  performance: "medium",
  scalability: "high",
  availability: "critical",
  security: "high",
  maintainability: "high",
  testability: "medium",
  consistency: "critical",
} as const;
const webDrivers = {
  "system-type": "server",
  "team-size": "4-10",
  experience: "some",
  budget: "moderate",
  growth: "moderate",
  lifespan: "5+",
  "time-to-market": "tight",
  "change-rate": "sometimes",
};
const webAttributes = {
  maintainability: "high",
  testability: "high",
  consistency: "high",
  security: "medium",
} as const;

export const goldenScenarios: GoldenScenario[] = [
  {
    id: "G1",
    title: "Student group project, beginner, very limited budget, prototype",
    input: exampleA,
    expectedTop: ["modular-monolith"],
  },
  {
    id: "G2",
    title: "Solo dev, quick prototype, very tight deadline",
    input: makeInput({
      drivers: {
        "team-size": "1-3",
        experience: "some",
        "time-to-market": "very-tight",
        growth: "stable",
        lifespan: "prototype",
      },
      attributes: { cost: "high", maintainability: "medium" },
    }),
    expectedTop: ["modular-monolith", "layered"],
  },
  {
    id: "G3",
    title: "Concert ticketing, flash spikes, experienced team",
    input: exampleB,
    expectedTop: ["space-based"],
  },
  {
    id: "G4",
    title: "IoT sensor platform, async events, high availability",
    input: makeInput({
      drivers: {
        "system-type": "server",
        "team-size": "4-10",
        experience: "experienced",
        budget: "moderate",
        growth: "rapid",
        lifespan: "5+",
      },
      attributes: { availability: "critical", scalability: "high", performance: "high" },
      characteristics: { "async-events": true },
    }),
    expectedTop: ["event-driven"],
  },
  {
    id: "G5",
    title: "30+ developers, clear domains, frequent independent releases, experienced",
    input: makeInput({
      drivers: {
        "team-size": "30+",
        experience: "experienced",
        budget: "comfortable",
        growth: "rapid",
        lifespan: "5+",
        "change-rate": "constantly",
      },
      attributes: { deployability: "critical", scalability: "high", availability: "high", maintainability: "high" },
      characteristics: { "domains-clear": "yes" },
    }),
    expectedTop: ["microservices"],
  },
  {
    id: "G6",
    title: "Mid-size business app, clear domains, migrating a legacy monolith",
    input: makeInput({
      drivers: {
        "system-type": "server",
        "team-size": "11-30",
        experience: "some",
        budget: "moderate",
        growth: "moderate",
        lifespan: "5+",
        "change-rate": "sometimes",
      },
      attributes: { maintainability: "high", testability: "high", deployability: "medium", consistency: "high" },
      characteristics: { "domains-clear": "yes", "legacy-migration": true },
    }),
    expectedTop: ["service-based"],
  },
  {
    id: "G7",
    title: "ETL / data processing tool",
    input: makeInput({
      drivers: { "team-size": "4-10", experience: "some", budget: "moderate", growth: "moderate", lifespan: "1-5" },
      attributes: { simplicity: "high", cost: "high", testability: "medium" },
      characteristics: { "sequential-processing": true },
    }),
    expectedTop: ["pipeline"],
  },
  {
    id: "G8",
    title: "Product with customer plug-ins, long-lived",
    input: makeInput({
      drivers: {
        "team-size": "4-10",
        experience: "some",
        budget: "moderate",
        growth: "moderate",
        lifespan: "5+",
        "change-rate": "sometimes",
      },
      attributes: { evolvability: "high", maintainability: "high", testability: "medium" },
      characteristics: { plugins: true },
    }),
    expectedTop: ["microkernel"],
  },
  {
    id: "G9",
    title: "Banking ledger: strict ACID, on-prem, regulated, strict workflow",
    input: makeInput({
      drivers: {
        "team-size": "11-30",
        experience: "experienced",
        budget: "comfortable",
        growth: "moderate",
        lifespan: "5+",
      },
      attributes: { consistency: "critical", security: "critical", availability: "high", maintainability: "high" },
      characteristics: {
        "strict-acid": true,
        hosting: "on-prem",
        regulated: true,
        "strict-workflow": true,
        "domains-clear": "yes",
      },
    }),
    expectedTop: ["service-based", "modular-monolith"],
  },
  {
    id: "G10",
    title: "Startup MVP: tiny team, very limited budget, spiky traffic (deliberate conflict)",
    input: makeInput({
      drivers: {
        "team-size": "1-3",
        experience: "some",
        budget: "very-limited",
        "time-to-market": "tight",
        growth: "spiky",
      },
      attributes: { deployability: "high", scalability: "low" },
    }),
    expectedTop: ["serverless", "service-based"],
  },
  {
    id: "G11",
    title: "Global multi-tenant SaaS, blast-radius isolation",
    input: makeInput({
      drivers: {
        "team-size": "30+",
        experience: "experienced",
        budget: "comfortable",
        growth: "rapid",
        lifespan: "5+",
      },
      attributes: { availability: "critical", scalability: "critical", security: "high", performance: "high" },
      characteristics: { "blast-radius": true, "domains-clear": "yes" },
    }),
    expectedTop: ["cell-based"],
  },
  {
    id: "G12",
    title: "On-prem + no lock-in + spiky load",
    input: makeInput({
      drivers: {
        "team-size": "11-30",
        experience: "experienced",
        budget: "moderate",
        growth: "spiky",
        lifespan: "1-5",
      },
      attributes: { performance: "critical", elasticity: "high", scalability: "high" },
      characteristics: { hosting: "on-prem", "no-lock-in": true, "spiky-concurrency": true },
    }),
    expectedTop: ["space-based"],
  },
  {
    id: "G13",
    title: "Direct device-to-device sharing, no central server",
    input: makeInput({
      drivers: { "team-size": "4-10", experience: "some", budget: "moderate", growth: "moderate", lifespan: "1-5" },
      attributes: { availability: "high", scalability: "high", cost: "medium" },
      characteristics: { p2p: true },
    }),
    expectedTop: ["peer-to-peer"],
  },
  {
    id: "G14",
    title: "On-site low-latency processing + async events",
    input: makeInput({
      drivers: {
        "team-size": "4-10",
        experience: "experienced",
        budget: "moderate",
        growth: "moderate",
        lifespan: "5+",
      },
      attributes: { performance: "critical", availability: "high" },
      characteristics: { edge: true, "async-events": true },
    }),
    expectedTop: ["event-driven", "edge"],
  },
  {
    id: "G15",
    title: "Changes mostly technical (UI/DB swaps), small beginner team",
    input: makeInput({
      drivers: { "team-size": "1-3", experience: "beginner", budget: "moderate", growth: "stable", lifespan: "1-5" },
      attributes: { maintainability: "high" },
      characteristics: { "tech-changes": true },
    }),
    expectedTop: ["layered"],
  },
  {
    id: "G16",
    title: 'Only "maintainability High", every driver "Not sure"',
    input: makeInput({ attributes: { maintainability: "high" } }),
    expectedTop: [],
  },
  {
    id: "G17",
    title: "Cross-platform desktop IDE with plug-ins, works offline",
    input: makeInput({
      drivers: { ...ideDrivers, "system-type": "installed", "qa-scope": "one" },
      attributes: ideAttributes,
      characteristics: { plugins: true, "domains-clear": "yes" },
    }),
    expectedTop: ["microkernel"],
  },
  {
    id: "G18",
    title: "Growing SaaS: 11–30 devs, clear domains, rapid growth, parts with different needs",
    input: makeInput({
      drivers: {
        "system-type": "server",
        "qa-scope": "different",
        "team-size": "11-30",
        experience: "some",
        budget: "moderate",
        growth: "rapid",
        lifespan: "5+",
        "change-rate": "constantly",
      },
      attributes: { scalability: "high", deployability: "high", maintainability: "high", availability: "medium" },
      characteristics: { "domains-clear": "yes" },
    }),
    expectedTop: ["microservices", "service-based"],
  },
  {
    id: "G19",
    title: "Ordinary business web app, 4–10 devs, one set of needs",
    input: makeInput({
      drivers: { ...webDrivers, "qa-scope": "one" },
      attributes: webAttributes,
      characteristics: { "domains-clear": "yes" },
    }),
    expectedTop: ["modular-monolith", "layered"],
  },
  {
    id: "G20",
    title: "Server product with customer plug-ins (CI-server style), one set of needs",
    input: makeInput({
      drivers: { ...ideDrivers, "system-type": "server", "qa-scope": "one" },
      attributes: ideAttributes,
      characteristics: { plugins: true, "domains-clear": "yes" },
    }),
    expectedTop: ["microkernel"],
  },
  {
    id: "G21",
    title: 'Desktop IDE answers with both new questions left "Not sure" (owner report, 2026-10-21)',
    input: makeInput({
      drivers: ideDrivers,
      attributes: ideAttributes,
      characteristics: { plugins: true, "domains-clear": "yes" },
    }),
    expectedTop: ["microkernel"],
  },
  {
    id: "G22",
    title: "Installed app without plug-ins",
    input: makeInput({
      drivers: { ...webDrivers, "system-type": "installed" },
      attributes: webAttributes,
    }),
    expectedTop: ["modular-monolith", "layered"],
  },
  {
    id: "G23",
    title:
      "Hospital system: staff web app + mobile view, one back end, 4–10 devs, parts differ (owner report, 2026-10-21)",
    input: makeInput({
      drivers: { ...hospitalDrivers, "system-type": "server", "qa-scope": "different" },
      attributes: hospitalAttributes,
      characteristics: { "domains-clear": "yes" },
    }),
    expectedTop: ["service-based"],
  },
  {
    id: "G24",
    title: 'Hospital system with the contradictory answers "installed app only" + "parts differ a lot"',
    input: makeInput({
      drivers: { ...hospitalDrivers, "system-type": "installed", "qa-scope": "different" },
      attributes: hospitalAttributes,
      characteristics: { "domains-clear": "yes" },
    }),
    expectedTop: [],
  },
];
