import {
  UnsupportedScreenshotUploadMimeTypeError,
  UploadTooLargeError,
} from "../errors/file-domain-error";

export {
  UnsupportedScreenshotUploadMimeTypeError,
  UploadTooLargeError,
};

const screenshot_upload_mime_types = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export const assert_supported_screenshot_upload_mime_type = (mime_type: string) => {
  const normalized = mime_type.trim().toLowerCase();

  if (!screenshot_upload_mime_types.has(normalized)) {
    throw new UnsupportedScreenshotUploadMimeTypeError();
  }

  return normalized;
};

export const assert_upload_size_within_limit = (input: {
  declared_size_bytes?: number;
  max_upload_bytes: number;
}) => {
  if (
    input.declared_size_bytes !== undefined
    && input.declared_size_bytes > input.max_upload_bytes
  ) {
    throw new UploadTooLargeError();
  }
};
