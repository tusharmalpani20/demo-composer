import { describe, expect, it } from "vitest";
import {
  PUBLISH_SLUG_RETRY_LIMIT,
  publish_slug_for_link,
  should_retry_slug_conflict,
} from "./publish-link-policy";

describe("publish link policy", () => {
  it("uses an existing slug or a generated slug", () => {
    expect(publish_slug_for_link({
      existing_link: { slug: "existing" },
      generated_slug: "generated",
    })).toBe("existing");

    expect(publish_slug_for_link({
      existing_link: null,
      generated_slug: "generated",
    })).toBe("generated");
  });

  it("caps slug conflict retries at five attempts", () => {
    expect(PUBLISH_SLUG_RETRY_LIMIT).toBe(5);
    expect(should_retry_slug_conflict(0)).toBe(true);
    expect(should_retry_slug_conflict(4)).toBe(true);
    expect(should_retry_slug_conflict(5)).toBe(false);
  });
});
