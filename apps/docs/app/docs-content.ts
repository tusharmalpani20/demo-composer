const repositoryBaseUrl = "https://github.com/tusharmalpani20/demo-composer/blob/main";
const alphaAssetBaseUrl = "https://raw.githubusercontent.com/tusharmalpani20/demo-composer/main/docs/assets/alpha";

export const siteSummary = {
  name: "Demo Composer",
  status: "alpha-stage, self-hosted open-source software",
  positioning: "Self-hosted teams can turn browser workflows into Scribe-style guides and Storylane-style interactive demos from screenshot-first capture sessions.",
  readmeHref: `${repositoryBaseUrl}/README.md`,
  selfHostingHref: `${repositoryBaseUrl}/docs/self-hosting.md`,
};

export const productCapabilities = [
  "Screenshot-first capture sessions with ordered events and uploaded assets.",
  "Scribe-style guides with editable blocks, screenshots, annotations, publishing, Markdown export, and HTML ZIP export.",
  "Storylane-style interactive demos with scenes, hotspots, publishing, password access, and embeds.",
  "Self-hosted setup with PostgreSQL, local file storage, health checks, readiness checks, and production env validation.",
];

export const docsLinks = [
  {
    label: "Self-hosting quickstart",
    href: `${repositoryBaseUrl}/docs/self-hosting.md`,
    description: "Local and production-oriented setup notes for self-hosted evaluators.",
  },
  {
    label: "Operations guide",
    href: `${repositoryBaseUrl}/docs/operations.md`,
    description: "Health checks, backups, restore expectations, storage, proxy, and env-report guidance.",
  },
  {
    label: "Production readiness checklist",
    href: `${repositoryBaseUrl}/docs/production-readiness-checklist.md`,
    description: "Preflight checklist before exposing a self-hosted instance beyond local development.",
  },
  {
    label: "Roadmap",
    href: `${repositoryBaseUrl}/docs/roadmap.md`,
    description: "Current alpha, V1 hardening, later work, and intentionally deferred product areas.",
  },
  {
    label: "Contributor guide",
    href: `${repositoryBaseUrl}/docs/contributor-guide.md`,
    description: "Repo layout, planning flow, quality bar, and good first contribution areas.",
  },
  {
    label: "V1 dogfood smoke suite",
    href: `${repositoryBaseUrl}/docs/v1-dogfood-smoke-suite.md`,
    description: "Recorded alpha smoke evidence and known manual dogfood limitations.",
  },
];

export const evidenceItems = [
  {
    title: "Project workspace",
    src: `${alphaAssetBaseUrl}/alpha-project-workspace.png`,
    alt: "Project workspace showing capture, guide, and interactive demo entry points.",
  },
  {
    title: "Guide editor",
    src: `${alphaAssetBaseUrl}/alpha-guide-editor.png`,
    alt: "Guide editor showing a generated guide with screenshot annotation and publishing controls.",
  },
  {
    title: "Interactive demo editor",
    src: `${alphaAssetBaseUrl}/alpha-demo-editor.png`,
    alt: "Interactive demo editor with scenes, hotspot controls, and publishing controls.",
  },
];

export const knownLimitations = [
  "Chrome extension screenshots are pending until extension dogfood has a passing or bounded capture path.",
  "Storage inventory and cleanup tooling are still future self-host operations work.",
  "Backup/restore rehearsal, one-command packaging, shared rate limiting, and object storage remain deferred.",
  "HTML capture/replay, AI authoring, analytics, lead capture, and custom branding are not planned for V1.",
  "Markdown docs remain the source of truth; this site is a compact navigation surface for the alpha.",
];
