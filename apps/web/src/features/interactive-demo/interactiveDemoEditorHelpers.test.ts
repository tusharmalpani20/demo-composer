import { describe, expect, it } from "vitest";
import {
  embedUrlFromPublicUrl,
  expiryInputToIso,
  formatExpiryInputValue,
  iframeEmbedCode,
  sortedHotspots,
  sortedScenes,
  validHotspotBox,
} from "./interactiveDemoEditorHelpers";
import type { DemoHotspot, DemoScene } from "./types";

const scene = (id: string, sceneIndex: number): DemoScene => ({
  id,
  organization_id: "org_1",
  project_id: "project_1",
  interactive_demo_id: "demo_1",
  source_capture_session_id: "capture_session_1",
  source_capture_event_id: null,
  source_capture_asset_id: null,
  background_capture_asset_id: null,
  scene_index: sceneIndex,
  title: `Scene ${sceneIndex}`,
  description: null,
  created_by_id: "user_1",
  updated_by_id: "user_1",
  version: 1,
  created_at: "2026-07-07T00:00:00.000Z",
  updated_at: "2026-07-07T00:00:00.000Z",
});

const hotspot = (id: string, hotspotIndex: number): DemoHotspot => ({
  id,
  organization_id: "org_1",
  project_id: "project_1",
  interactive_demo_id: "demo_1",
  demo_scene_id: "scene_1",
  hotspot_type: "info",
  label: `Hotspot ${hotspotIndex}`,
  content: null,
  x: 0.1,
  y: 0.1,
  width: 0.2,
  height: 0.2,
  target_scene_id: null,
  hotspot_index: hotspotIndex,
  created_by_id: "user_1",
  updated_by_id: "user_1",
  version: 1,
  created_at: "2026-07-07T00:00:00.000Z",
  updated_at: "2026-07-07T00:00:00.000Z",
});

describe("interactive demo editor helpers", () => {
  it("sorts scenes and hotspots without mutating input", () => {
    const scenes = [scene("second", 2), scene("first", 1)];
    const hotspots = [hotspot("second", 2), hotspot("first", 1)];

    expect(sortedScenes(scenes).map((candidate) => candidate.id)).toEqual([
      "first",
      "second",
    ]);
    expect(scenes.map((candidate) => candidate.id)).toEqual([
      "second",
      "first",
    ]);

    expect(sortedHotspots(hotspots).map((candidate) => candidate.id)).toEqual([
      "first",
      "second",
    ]);
    expect(hotspots.map((candidate) => candidate.id)).toEqual([
      "second",
      "first",
    ]);
  });

  it("validates hotspot boxes within normalized scene bounds", () => {
    expect(validHotspotBox({ x: 0, y: 0, width: 1, height: 1 })).toBe(true);
    expect(validHotspotBox({ x: 0.9, y: 0.1, width: 0.2, height: 0.2 })).toBe(false);
    expect(validHotspotBox({ x: 0.1, y: 0.1, width: 0, height: 0.2 })).toBe(false);
  });

  it("formats and parses publish expiry inputs", () => {
    expect(formatExpiryInputValue("2026-06-16T10:30:00.000Z")).toMatch(
      /^2026-06-16T/,
    );
    expect(formatExpiryInputValue(null)).toBe("");
    expect(formatExpiryInputValue("not-a-date")).toBe("");
    expect(expiryInputToIso("")).toBeNull();
    expect(expiryInputToIso("not-a-date")).toBeNull();
    expect(expiryInputToIso("2026-06-16T10:30")).toContain("2026-06-16T");
  });

  it("builds safe embed URLs and iframe HTML", () => {
    expect(embedUrlFromPublicUrl("https://example.test/d/demo_1")).toBe(
      "https://example.test/d/demo_1/embed",
    );
    expect(iframeEmbedCode("https://example.test/d/demo_1/embed", "Demo \"One\"")).toBe(
      '<iframe src="https://example.test/d/demo_1/embed" title="Demo &quot;One&quot;" loading="lazy"></iframe>',
    );
  });
});
