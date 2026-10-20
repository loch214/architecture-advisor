/**
 * Fitness functions for module boundaries (ARCHITECTURE.md §6 and §8).
 * Allowed: app → components → recommendation → scoring → knowledge-base;
 * app/api → recommendation, ai, platform; ai → scoring, knowledge-base, platform.
 */
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "kb-is-a-leaf",
      comment: "The knowledge base depends on nothing but Zod.",
      severity: "error",
      from: { path: "^src/modules/knowledge-base/" },
      to: { pathNot: ["^src/modules/knowledge-base/", "node_modules/zod/"] },
    },
    {
      name: "scoring-is-pure",
      comment: "The engine imports only the knowledge base: no React, Next, network, AI or platform code.",
      severity: "error",
      from: { path: "^src/modules/scoring/" },
      to: { pathNot: ["^src/modules/scoring/", "^src/modules/knowledge-base/", "node_modules/zod/"] },
    },
    {
      name: "recommendation-boundary",
      comment: "Builds the result object from the engine and KB only.",
      severity: "error",
      from: { path: "^src/modules/recommendation/" },
      to: {
        pathNot: ["^src/modules/(recommendation|scoring|knowledge-base)/", "node_modules/zod/"],
      },
    },
    {
      name: "ai-boundary",
      comment: "The AI module may use scoring, the KB and platform, never UI code.",
      severity: "error",
      from: { path: "^src/modules/ai/" },
      to: { path: "^src/(app|components)/" },
    },
    {
      name: "no-server-code-in-client",
      comment: "Components and pages never import server-only modules (platform, AI providers).",
      severity: "error",
      from: { path: "^src/(components|lib)/|^src/app/(?!api/)" },
      to: { path: ["^src/modules/platform/", "^src/modules/ai/providers/", "node_modules/server-only/"] },
    },
    {
      name: "modules-dont-import-ui",
      comment: "Domain modules never depend on the UI layer.",
      severity: "error",
      from: { path: "^src/modules/" },
      to: { path: "^src/(app|components)/" },
    },
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: { exportsFields: ["exports"], conditionNames: ["import", "require", "node", "default", "types"] },
    exclude: { path: "\\.next" },
  },
};
