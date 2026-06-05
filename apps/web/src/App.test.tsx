import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

describe("App", () => {
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

  it("renders an unsupported route state", () => {
    window.history.pushState({}, "", "/unknown");

    render(<App />);

    expect(screen.getByText("Open a capture session link to view its source material.")).toBeInTheDocument();
  });
});
