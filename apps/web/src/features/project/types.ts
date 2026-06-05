export type ProjectStatus = "active" | "archived";

export type Project = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  slug: string | null;
  color: string | null;
  icon: string | null;
  status: ProjectStatus;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: string;
  updated_at: string;
};
