import { describe, expect, it } from "vitest";
import {
  assert_public_viewer_password_result,
  public_viewer_session_expires_at,
  validate_public_viewer_password_input,
  validate_publish_password_input,
} from "./publish-password-policy";
import {
  InvalidPublicViewerPasswordError,
  InvalidPublishPasswordSettingsError,
} from "../errors/publish-domain-error";

describe("publish password policy", () => {
  it("validates publish password settings", () => {
    expect(validate_publish_password_input(null)).toBeNull();
    expect(validate_publish_password_input(" 12345678 ")).toBe(" 12345678 ");

    expect(() => validate_publish_password_input("short")).toThrow(InvalidPublishPasswordSettingsError);
    expect(() => validate_publish_password_input("x".repeat(129))).toThrow(InvalidPublishPasswordSettingsError);
  });

  it("validates public viewer password input and verification result", () => {
    expect(validate_public_viewer_password_input("secret")).toBe("secret");
    expect(() => validate_public_viewer_password_input(null)).toThrow(InvalidPublicViewerPasswordError);
    expect(() => assert_public_viewer_password_result(false)).toThrow(InvalidPublicViewerPasswordError);
    expect(assert_public_viewer_password_result(true)).toBeUndefined();
  });

  it("creates a 12 hour viewer session expiry", () => {
    expect(public_viewer_session_expires_at(new Date("2026-07-07T00:00:00.000Z")))
      .toBe("2026-07-07T12:00:00.000Z");
  });
});
