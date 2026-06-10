import { describe, expect, it } from "vitest";
import { parsePortalRoute } from "./routes";

describe("parsePortalRoute", () => {
  it("parses login routes", () => {
    expect(parsePortalRoute("/login")).toEqual({ type: "login" });
    expect(parsePortalRoute("/login/")).toEqual({ type: "login" });
  });

  it("parses project list routes", () => {
    expect(parsePortalRoute("/")).toEqual({ type: "project_list" });
    expect(parsePortalRoute("/projects")).toEqual({ type: "project_list" });
    expect(parsePortalRoute("/projects/")).toEqual({ type: "project_list" });
  });

  it("parses project workspace routes", () => {
    expect(parsePortalRoute("/projects/project_1")).toEqual({
      type: "project_workspace",
      projectId: "project_1",
    });
    expect(parsePortalRoute("/projects/project_1/")).toEqual({
      type: "project_workspace",
      projectId: "project_1",
    });
  });

  it("parses capture session detail routes", () => {
    expect(parsePortalRoute("/projects/project_1/capture-sessions/capture_session_1")).toEqual({
      type: "capture_session_detail",
      projectId: "project_1",
      captureSessionId: "capture_session_1",
    });
  });

  it("parses project capture session list routes", () => {
    expect(parsePortalRoute("/projects/project_1/capture-sessions")).toEqual({
      type: "project_capture_session_list",
      projectId: "project_1",
    });
    expect(parsePortalRoute("/projects/project_1/capture-sessions/")).toEqual({
      type: "project_capture_session_list",
      projectId: "project_1",
    });
  });

  it("parses guide detail routes", () => {
    expect(parsePortalRoute("/projects/project_1/guides/guide_1")).toEqual({
      type: "guide_detail",
      projectId: "project_1",
      guideId: "guide_1",
    });
  });

  it("parses guide preview routes", () => {
    expect(parsePortalRoute("/projects/project_1/guides/guide_1/preview")).toEqual({
      type: "guide_preview",
      projectId: "project_1",
      guideId: "guide_1",
    });
    expect(parsePortalRoute("/projects/project%201/guides/guide%20%2F%201/preview")).toEqual({
      type: "guide_preview",
      projectId: "project 1",
      guideId: "guide / 1",
    });
  });

  it("parses project guide list routes", () => {
    expect(parsePortalRoute("/projects/project_1/guides")).toEqual({
      type: "project_guide_list",
      projectId: "project_1",
    });
    expect(parsePortalRoute("/projects/project_1/guides/")).toEqual({
      type: "project_guide_list",
      projectId: "project_1",
    });
  });

  it("rejects unsupported routes", () => {
    expect(parsePortalRoute("/unknown")).toEqual({ type: "unsupported" });
  });
});
