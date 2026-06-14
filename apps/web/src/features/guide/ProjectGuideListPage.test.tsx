import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "../../lib/api";
import { ProjectGuideListPage } from "./ProjectGuideListPage";
import type { Guide, GuidePublishStatusResponse } from "./types";

const guides: Guide[] = [
  {
    id: "guide_2",
    organization_id: "organization_1",
    project_id: "project_1",
    source_capture_session_id: null,
    title: "Archived onboarding guide",
    description: null,
    status: "archived",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 3,
    created_at: "2026-06-05T09:00:00.000Z",
    updated_at: "2026-06-05T11:00:00.000Z",
  },
  {
    id: "guide_1",
    organization_id: "organization_1",
    project_id: "project_1",
    source_capture_session_id: "capture_session_1",
    title: "Department guide",
    description: "Set up departments from the list view.",
    status: "draft",
    created_by_id: "org_user_1",
    updated_by_id: "org_user_1",
    version: 1,
    created_at: "2026-06-05T10:00:00.000Z",
    updated_at: "2026-06-05T10:30:00.000Z",
  },
];

const unpublishedStatus: GuidePublishStatusResponse = {
  publish_link: null,
  published_artifact: null,
};

const publishedStatus = (guideId: string, publicUrl: string): GuidePublishStatusResponse => ({
  publish_link: {
    id: `publish_link_${guideId}`,
    artifact_type: "guide",
    artifact_id: guideId,
    published_artifact_id: `published_artifact_${guideId}`,
    slug: publicUrl.replace("/p/", ""),
    visibility: "public",
    expires_at: null,
    status: "active",
    published_at: "2026-06-11T00:00:00.000Z",
    revoked_at: null,
    public_url: publicUrl,
    password_protected: false,
  },
  published_artifact: {
    id: `published_artifact_${guideId}`,
    artifact_type: "guide",
    artifact_id: guideId,
    version_number: 1,
    title: "Published guide",
    published_at: "2026-06-11T00:00:00.000Z",
  },
});

const renderPage = (overrides: {
  projectId?: string;
  loadGuides?: () => Promise<{ guides: Guide[] }>;
  loadPublishStatus?: (projectId: string, guideId: string) => Promise<GuidePublishStatusResponse>;
} = {}) => {
  const loadGuides = overrides.loadGuides ?? vi.fn(async () => ({ guides }));
  const loadPublishStatus = overrides.loadPublishStatus ?? vi.fn(async () => unpublishedStatus);

  render(
    <ProjectGuideListPage
      projectId={overrides.projectId ?? "project_1"}
      loadGuides={loadGuides}
      loadPublishStatus={loadPublishStatus}
    />
  );

  return { loadGuides, loadPublishStatus };
};

describe("ProjectGuideListPage", () => {
  it("renders project guides in response order with editor and preview links", async () => {
    const { loadGuides } = renderPage();

    expect(screen.getByText("Loading guides...")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Guides" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();

    const rows = screen.getAllByRole("article");
    expect(within(rows[0]!).getByRole("heading", { name: "Archived onboarding guide" })).toBeInTheDocument();
    expect(within(rows[1]!).getByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    expect(screen.getByText("archived")).toBeInTheDocument();
    expect(screen.getByText("draft")).toBeInTheDocument();
    expect(screen.getByText("Set up departments from the list view.")).toBeInTheDocument();
    expect(screen.getByText("No source capture")).toBeInTheDocument();
    expect(screen.getByText("Source capture: capture_session_1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open guide Department guide" })).toHaveAttribute(
      "href",
      "/projects/project_1/guides/guide_1"
    );
    expect(screen.getByRole("link", { name: "Preview guide Department guide" })).toHaveAttribute(
      "href",
      "/projects/project_1/guides/guide_1/preview"
    );
    expect(loadGuides).toHaveBeenCalledWith("project_1");
    expect(screen.queryByText("organization_1")).not.toBeInTheDocument();
    expect(screen.queryByText("org_user_1")).not.toBeInTheDocument();
    expect(screen.queryByText("version")).not.toBeInTheDocument();
  });

  it("URL-encodes project and guide IDs in editor links", async () => {
    renderPage({
      projectId: "project 1",
      loadGuides: async () => ({
        guides: [{
          ...guides[0]!,
          id: "guide / 1",
          title: "Encoded guide",
        }],
      }),
    });

    expect(await screen.findByRole("link", { name: "Open guide Encoded guide" })).toHaveAttribute(
      "href",
      "/projects/project%201/guides/guide%20%2F%201"
    );
    expect(screen.getByRole("link", { name: "Preview guide Encoded guide" })).toHaveAttribute(
      "href",
      "/projects/project%201/guides/guide%20%2F%201/preview"
    );
  });

  it("renders publish status for each guide without blocking the list", async () => {
    const loadPublishStatus = vi.fn(() => new Promise<GuidePublishStatusResponse>(() => undefined));

    const { loadGuides } = renderPage({ loadPublishStatus });

    expect(await screen.findByRole("heading", { name: "Archived onboarding guide" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    expect(screen.getAllByText("Checking...")).toHaveLength(2);
    expect(loadGuides).toHaveBeenCalledWith("project_1");
    await waitFor(() => expect(loadPublishStatus).toHaveBeenCalledTimes(2));
    expect(loadPublishStatus).toHaveBeenCalledWith("project_1", "guide_2");
    expect(loadPublishStatus).toHaveBeenCalledWith("project_1", "guide_1");
  });

  it("shows active public guide links and unpublished status in the guide list", async () => {
    const loadPublishStatus = vi.fn(async (_projectId: string, guideId: string) => (
      guideId === "guide_2" ? publishedStatus("guide_2", "/p/archived-guide") : unpublishedStatus
    ));

    renderPage({ loadPublishStatus });

    const archivedRow = (await screen.findByRole("heading", { name: "Archived onboarding guide" })).closest("article");
    const draftRow = screen.getByRole("heading", { name: "Department guide" }).closest("article");

    expect(archivedRow).not.toBeNull();
    expect(draftRow).not.toBeNull();
    expect(await within(archivedRow!).findByText("Published")).toBeInTheDocument();
    expect(within(archivedRow!).getByRole("link", { name: "Open public guide Archived onboarding guide" })).toHaveAttribute(
      "href",
      "/p/archived-guide"
    );
    expect(await within(draftRow!).findByText("Not published")).toBeInTheDocument();
    expect(within(draftRow!).queryByRole("link", { name: /Open public guide/ })).not.toBeInTheDocument();
    expect(screen.queryByText("publish_link_guide_2")).not.toBeInTheDocument();
    expect(screen.queryByText("published_artifact_guide_2")).not.toBeInTheDocument();
  });

  it("does not expose public-open links for restricted or expired publish links", async () => {
    const loadPublishStatus = vi.fn(async (_projectId: string, guideId: string) => {
      if (guideId === "guide_2") {
        return {
          ...publishedStatus("guide_2", "/p/archived-guide"),
          publish_link: {
            ...publishedStatus("guide_2", "/p/archived-guide").publish_link!,
            visibility: "restricted" as const,
          },
        };
      }

      return {
        ...publishedStatus("guide_1", "/p/department-guide"),
        publish_link: {
          ...publishedStatus("guide_1", "/p/department-guide").publish_link!,
          expires_at: "2020-01-01T00:00:00.000Z",
        },
      };
    });

    renderPage({ loadPublishStatus });

    const archivedRow = (await screen.findByRole("heading", { name: "Archived onboarding guide" })).closest("article");
    const draftRow = screen.getByRole("heading", { name: "Department guide" }).closest("article");

    expect(await within(archivedRow!).findByText("Published - access off")).toBeInTheDocument();
    expect(await within(draftRow!).findByText("Published - expired")).toBeInTheDocument();
    expect(within(archivedRow!).queryByRole("link", { name: /Open public guide/ })).not.toBeInTheDocument();
    expect(within(draftRow!).queryByRole("link", { name: /Open public guide/ })).not.toBeInTheDocument();
  });

  it("shows per-guide publish status failures without breaking the guide list", async () => {
    const loadPublishStatus = vi.fn(async (_projectId: string, guideId: string) => {
      if (guideId === "guide_2") {
        throw new Error("status failed");
      }

      return publishedStatus("guide_1", "/p/department-guide");
    });

    renderPage({ loadPublishStatus });

    const archivedRow = (await screen.findByRole("heading", { name: "Archived onboarding guide" })).closest("article");
    const draftRow = screen.getByRole("heading", { name: "Department guide" }).closest("article");

    expect(archivedRow).not.toBeNull();
    expect(draftRow).not.toBeNull();
    expect(await within(archivedRow!).findByText("Could not check")).toBeInTheDocument();
    expect(await within(draftRow!).findByText("Published")).toBeInTheDocument();
    expect(within(draftRow!).getByRole("link", { name: "Open public guide Department guide" })).toHaveAttribute(
      "href",
      "/p/department-guide"
    );
  });

  it("ignores stale publish status responses after the project changes", async () => {
    let resolveOldStatus: ((value: GuidePublishStatusResponse) => void) | undefined;
    const currentGuide = {
      ...guides[1]!,
      title: "Current project guide",
    };
    const loadGuides = vi.fn(async (projectId: string) => ({
      guides: projectId === "project_old" ? [guides[1]!] : [currentGuide],
    }));
    const loadPublishStatus = vi.fn((projectId: string) => {
      if (projectId === "project_old") {
        return new Promise<GuidePublishStatusResponse>((resolve) => {
          resolveOldStatus = resolve;
        });
      }

      return Promise.resolve(unpublishedStatus);
    });

    const { rerender } = render(
      <ProjectGuideListPage
        projectId="project_old"
        loadGuides={loadGuides}
        loadPublishStatus={loadPublishStatus}
      />
    );

    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    await waitFor(() => expect(loadPublishStatus).toHaveBeenCalledWith("project_old", "guide_1"));

    rerender(
      <ProjectGuideListPage
        projectId="project_current"
        loadGuides={loadGuides}
        loadPublishStatus={loadPublishStatus}
      />
    );

    expect(await screen.findByRole("heading", { name: "Current project guide" })).toBeInTheDocument();
    expect(await screen.findByText("Not published")).toBeInTheDocument();

    resolveOldStatus?.(publishedStatus("guide_1", "/p/old-guide"));

    await waitFor(() => {
      expect(screen.queryByRole("link", { name: "Open public guide Current project guide" })).not.toBeInTheDocument();
    });
    expect(screen.queryByText("Published")).not.toBeInTheDocument();
    expect(screen.queryByText("/p/old-guide")).not.toBeInTheDocument();
  });

  it("renders empty guide lists", async () => {
    renderPage({
      loadGuides: async () => ({ guides: [] }),
    });

    expect(await screen.findByText("No guides yet.")).toBeInTheDocument();
  });

  it("renders unauthenticated and not-found states", async () => {
    const { rerender } = render(
      <ProjectGuideListPage
        projectId="project_1"
        currentPath="/projects/project_1/guides"
        loadGuides={async () => {
          throw new ApiClientError({
            kind: "unauthenticated",
            status: 401,
            type: "unauthenticated",
            message: "Authentication is required",
          });
        }}
      />
    );

    expect(await screen.findByText("Sign in to view guides.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login?next=%2Fprojects%2Fproject_1%2Fguides"
    );

    rerender(
      <ProjectGuideListPage
        projectId="missing"
        loadGuides={async () => {
          throw new ApiClientError({
            kind: "not_found",
            status: 404,
            type: "project_not_found",
            message: "Project was not found",
          });
        }}
      />
    );

    expect(await screen.findByText("Project was not found.")).toBeInTheDocument();
  });

  it("renders generic errors and supports retry", async () => {
    const loadGuides = vi
      .fn<() => Promise<{ guides: Guide[] }>>()
      .mockRejectedValueOnce(new Error("Network failed"))
      .mockResolvedValueOnce({ guides });

    renderPage({ loadGuides });

    expect(await screen.findByText("Could not load guides.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(loadGuides).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("heading", { name: "Archived onboarding guide" })).toBeInTheDocument();
  });
});
