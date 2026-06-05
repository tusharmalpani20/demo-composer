import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders project workspace routes", async () => {
    window.history.pushState({}, "", "/projects/project_1");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      project: {
        id: "project_1",
        organization_id: "organization_1",
        name: "Internal onboarding demos",
        description: "Reusable captures and guides for internal teams.",
        slug: "internal-onboarding-demos",
        color: "#2563eb",
        icon: "folder",
        status: "active",
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-05T10:00:00.000Z",
        updated_at: "2026-06-05T10:05:00.000Z",
      },
    }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    })));

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Internal onboarding demos" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open capture sessions" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open guides" })).toBeInTheDocument();
  });

  it("renders capture session detail routes", async () => {
    window.history.pushState({}, "", "/projects/project_1/capture-sessions/capture_session_1");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      capture_session: {
        id: "capture_session_1",
        organization_id: "organization_1",
        project_id: "project_1",
        name: "Create department workflow",
        description: null,
        status: "draft",
        source_type: "extension",
        started_at: null,
        completed_at: null,
        canceled_at: null,
        start_url: null,
        browser_name: null,
        browser_version: null,
        operating_system: null,
        viewport_width: null,
        viewport_height: null,
        device_pixel_ratio: null,
        user_agent: null,
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-05T10:00:00.000Z",
        updated_at: "2026-06-05T10:00:00.000Z",
      },
      capture_events: [],
      capture_assets: [],
    }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    })));

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Create department workflow" })).toBeInTheDocument();
  });

  it("renders project capture session list routes", async () => {
    window.history.pushState({}, "", "/projects/project_1/capture-sessions");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      capture_sessions: [{
        id: "capture_session_1",
        organization_id: "organization_1",
        project_id: "project_1",
        name: "Create department workflow",
        description: null,
        status: "completed",
        source_type: "extension",
        started_at: null,
        completed_at: null,
        canceled_at: null,
        start_url: null,
        browser_name: null,
        browser_version: null,
        operating_system: null,
        viewport_width: null,
        viewport_height: null,
        device_pixel_ratio: null,
        user_agent: null,
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-05T10:00:00.000Z",
        updated_at: "2026-06-05T10:00:00.000Z",
      }],
    }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    })));

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Capture sessions" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Create department workflow" })).toBeInTheDocument();
  });

  it("renders guide editor routes", async () => {
    window.history.pushState({}, "", "/projects/project_1/guides/guide_1");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      guide: {
        id: "guide_1",
        organization_id: "organization_1",
        project_id: "project_1",
        source_capture_session_id: null,
        title: "Department guide",
        description: "Set up departments from the list view.",
        status: "draft",
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-05T10:00:00.000Z",
        updated_at: "2026-06-05T10:00:00.000Z",
      },
      guide_blocks: [],
    }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    })));

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Department guide" })).toBeInTheDocument();
    expect(screen.getByText("This guide does not have any blocks yet.")).toBeInTheDocument();
  });

  it("renders project guide list routes", async () => {
    window.history.pushState({}, "", "/projects/project_1/guides");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      guides: [{
        id: "guide_1",
        organization_id: "organization_1",
        project_id: "project_1",
        source_capture_session_id: "capture_session_1",
        title: "Department guide",
        description: null,
        status: "draft",
        created_by_id: "org_user_1",
        updated_by_id: "org_user_1",
        version: 1,
        created_at: "2026-06-05T10:00:00.000Z",
        updated_at: "2026-06-05T10:00:00.000Z",
      }],
    }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    })));

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Guides" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Department guide" })).toBeInTheDocument();
  });

  it("renders an unsupported route state", () => {
    window.history.pushState({}, "", "/unknown");

    render(<App />);

    expect(screen.getByRole("heading", { name: "Demo Composer portal" })).toBeInTheDocument();
    expect(screen.getByText("Open a project workspace, capture session list, capture session, guide list, or guide link to continue.")).toBeInTheDocument();
  });
});
