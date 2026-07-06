export const PROJECT_STATUSES = [
  "active",
  "archived",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
