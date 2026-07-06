import { describe, expect, it } from "vitest";
import {
  InvalidFileMetadataError,
  normalize_file_metadata,
} from "../policies/file-metadata-policy";

describe("file metadata policy", () => {
  it("normalizes valid file metadata with local storage defaults", () => {
    expect(normalize_file_metadata({
      storage_key: " captures/org/project/session/screenshot-1.png ",
      mime_type: " image/png ",
      size_bytes: 123456,
      original_name: " screenshot-1.png ",
      checksum_sha256: " checksum ",
      metadata: { capture_mode: "manual" },
    })).toEqual({
      storage_provider: "local",
      storage_key: "captures/org/project/session/screenshot-1.png",
      mime_type: "image/png",
      size_bytes: 123456,
      original_name: "screenshot-1.png",
      checksum_sha256: "checksum",
      metadata: { capture_mode: "manual" },
    });
  });

  it("converts empty optional strings to null while preserving explicit provider", () => {
    expect(normalize_file_metadata({
      storage_provider: "external",
      storage_key: "external/file.png",
      mime_type: "image/png",
      size_bytes: 0,
      original_name: " ",
      checksum_sha256: "",
    })).toEqual({
      storage_provider: "external",
      storage_key: "external/file.png",
      mime_type: "image/png",
      size_bytes: 0,
      original_name: null,
      checksum_sha256: null,
      metadata: undefined,
    });
  });

  it("rejects missing or blank required file metadata", () => {
    expect(() => normalize_file_metadata({
      storage_key: " ",
      mime_type: "image/png",
      size_bytes: 1,
    })).toThrow(InvalidFileMetadataError);

    expect(() => normalize_file_metadata({
      storage_key: "capture.png",
      mime_type: "",
      size_bytes: 1,
    })).toThrow(InvalidFileMetadataError);
  });

  it("rejects non-image file metadata for screenshot assets", () => {
    expect(() => normalize_file_metadata({
      storage_key: "capture.txt",
      mime_type: "text/plain",
      size_bytes: 1,
    })).toThrow(InvalidFileMetadataError);
  });

  it("rejects unsupported storage providers", () => {
    expect(() => normalize_file_metadata({
      storage_provider: "s3" as never,
      storage_key: "capture.png",
      mime_type: "image/png",
      size_bytes: 1,
    })).toThrow(InvalidFileMetadataError);
  });

  it("rejects negative or non-integer size bytes", () => {
    expect(() => normalize_file_metadata({
      storage_key: "capture.png",
      mime_type: "image/png",
      size_bytes: -1,
    })).toThrow(InvalidFileMetadataError);

    expect(() => normalize_file_metadata({
      storage_key: "capture.png",
      mime_type: "image/png",
      size_bytes: 1.5,
    })).toThrow(InvalidFileMetadataError);
  });
});
