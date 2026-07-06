import { describe, expect, it } from "vitest";
import {
  assert_supported_screenshot_upload_mime_type,
  assert_upload_size_within_limit,
  UnsupportedScreenshotUploadMimeTypeError,
  UploadTooLargeError,
} from "../policies/screenshot-upload-policy";

describe("screenshot upload policy", () => {
  it("accepts supported screenshot upload mime types and normalizes case", () => {
    expect(assert_supported_screenshot_upload_mime_type("image/png")).toBe("image/png");
    expect(assert_supported_screenshot_upload_mime_type("IMAGE/JPEG")).toBe("image/jpeg");
    expect(assert_supported_screenshot_upload_mime_type(" image/webp ")).toBe("image/webp");
  });

  it("rejects unsupported or blank upload mime types", () => {
    expect(() => assert_supported_screenshot_upload_mime_type("text/html"))
      .toThrow(UnsupportedScreenshotUploadMimeTypeError);
    expect(() => assert_supported_screenshot_upload_mime_type(" "))
      .toThrow(UnsupportedScreenshotUploadMimeTypeError);
  });

  it("rejects declared upload sizes over the configured maximum", () => {
    expect(() => assert_upload_size_within_limit({
      declared_size_bytes: 21,
      max_upload_bytes: 20,
    })).toThrow(UploadTooLargeError);
  });

  it("allows omitted declared upload sizes and sizes at the maximum", () => {
    expect(() => assert_upload_size_within_limit({
      max_upload_bytes: 20,
    })).not.toThrow();
    expect(() => assert_upload_size_within_limit({
      declared_size_bytes: 20,
      max_upload_bytes: 20,
    })).not.toThrow();
  });
});
