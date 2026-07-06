import { describe, expect, it } from "vitest";
import {
  GuideNotEditableError,
  InvalidGuideInputError,
  InvalidGuideStepInputError,
  assert_guide_is_editable,
  normalize_update_guide_input,
  normalize_update_guide_step_input,
} from "./guide-update-policy";

describe("guide update policy", () => {
  it("normalizes guide metadata updates and rejects empty or invalid status updates", () => {
    expect(normalize_update_guide_input({
      title: ` ${"A".repeat(200)} `,
      description: " ",
      status: "archived",
    })).toEqual({
      title: "A".repeat(180),
      description: null,
      status: "archived",
    });

    expect(() => normalize_update_guide_input({})).toThrow(InvalidGuideInputError);
    expect(() => normalize_update_guide_input({
      status: "draft" as never,
    })).toThrow(InvalidGuideInputError);
  });

  it("normalizes guide step updates and checks editability", () => {
    expect(normalize_update_guide_step_input({
      title: " Step ",
      body: " ",
    })).toEqual({
      title: "Step",
      body: null,
    });

    expect(() => normalize_update_guide_step_input({ title: " " })).toThrow(InvalidGuideStepInputError);
    expect(() => assert_guide_is_editable({ status: "archived" })).toThrow(GuideNotEditableError);
    expect(assert_guide_is_editable({ status: "draft" })).toBeUndefined();
  });
});
