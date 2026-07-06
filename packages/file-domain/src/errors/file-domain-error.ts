export type FileDomainErrorStatusHint =
  | "bad_request"
  | "payload_too_large";

export class FileDomainError extends Error {
  readonly code: string;
  readonly status_hint: FileDomainErrorStatusHint;

  constructor(input: {
    code: string;
    message: string;
    status_hint: FileDomainErrorStatusHint;
  }) {
    super(input.message);
    this.name = new.target.name;
    this.code = input.code;
    this.status_hint = input.status_hint;
  }
}

export class InvalidFileMetadataError extends FileDomainError {
  constructor() {
    super({
      code: "invalid_capture_asset",
      message: "Capture asset input is invalid",
      status_hint: "bad_request",
    });
  }
}

export class UnsupportedScreenshotUploadMimeTypeError extends FileDomainError {
  constructor() {
    super({
      code: "unsupported_capture_asset_upload_type",
      message: "Capture asset upload type is not supported",
      status_hint: "bad_request",
    });
  }
}

export class UploadTooLargeError extends FileDomainError {
  constructor() {
    super({
      code: "upload_too_large",
      message: "Capture asset upload is too large",
      status_hint: "payload_too_large",
    });
  }
}
