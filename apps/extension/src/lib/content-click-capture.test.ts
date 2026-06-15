import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildClickCaptureMessage,
  shouldCaptureClick,
  truncateSafeText,
} from "./content-click-capture";

describe("content click capture", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1440,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 900,
    });
    Object.defineProperty(window, "devicePixelRatio", {
      configurable: true,
      value: 2,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("builds safe click metadata from primary trusted clicks", () => {
    const button = document.createElement("button");
    button.dataset.testid = "add-department";
    button.textContent = "  Add Department  ";
    button.getBoundingClientRect = vi.fn(() => ({
      x: 200,
      y: 60,
      width: 160,
      height: 44,
      top: 60,
      right: 360,
      bottom: 104,
      left: 200,
      toJSON: () => ({}),
    }));
    document.body.appendChild(button);
    const event = {
      button: 0,
      clientX: 240,
      clientY: 80,
      isTrusted: true,
      target: button,
    } as unknown as MouseEvent;

    expect(shouldCaptureClick(event)).toBe(true);
    expect(buildClickCaptureMessage(event)).toEqual({
      type: "demo_composer:page_click",
      payload: {
        page_url: "http://localhost:3000/",
        page_title: null,
        target_text: "Add Department",
        target_role: "button",
        target_test_id: "add-department",
        target_selector: "button[data-testid=\"add-department\"]",
        client_x: 240,
        client_y: 80,
        viewport_width: 1440,
        viewport_height: 900,
        device_pixel_ratio: 2,
        bounding_box: {
          x: 200,
          y: 60,
          width: 160,
          height: 44,
        },
      },
    });
  });

  it("skips synthetic non-primary and form field clicks", () => {
    const input = document.createElement("input");
    input.value = "secret";
    const editable = document.createElement("div");
    editable.setAttribute("contenteditable", "plaintext-only");
    document.body.appendChild(input);
    document.body.appendChild(editable);
    const synthetic = {
      button: 0,
      isTrusted: false,
      target: input,
    } as unknown as MouseEvent;
    const rightClick = {
      button: 2,
      isTrusted: true,
      target: document.body,
    } as unknown as MouseEvent;
    const editableClick = {
      button: 0,
      isTrusted: true,
      target: editable,
    } as unknown as MouseEvent;

    expect(shouldCaptureClick(synthetic)).toBe(false);
    expect(shouldCaptureClick(rightClick)).toBe(false);
    expect(shouldCaptureClick(editableClick)).toBe(false);
  });

  it("truncates long visible text", () => {
    expect(truncateSafeText("a".repeat(200))).toHaveLength(120);
  });
});
