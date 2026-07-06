export const INTERACTIVE_DEMO_STATUSES = [
  "draft",
  "archived",
] as const;
export type InteractiveDemoStatus = (typeof INTERACTIVE_DEMO_STATUSES)[number];

export const DEMO_HOTSPOT_TYPES = [
  "click",
  "info",
  "next",
] as const;
export type DemoHotspotType = (typeof DEMO_HOTSPOT_TYPES)[number];
