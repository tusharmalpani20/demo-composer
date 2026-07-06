import {
  InvalidPublicViewerPasswordError,
  InvalidPublishPasswordSettingsError,
} from "../errors/publish-domain-error";

const public_viewer_session_ttl_ms = 12 * 60 * 60 * 1000;

export const validate_publish_password_input = (password: unknown) => {
  if (password === null) {
    return null;
  }

  if (
    typeof password !== "string"
    || password.trim().length < 8
    || password.length > 128
  ) {
    throw new InvalidPublishPasswordSettingsError();
  }

  return password;
};

export const validate_public_viewer_password_input = (password: unknown) => {
  if (typeof password !== "string") {
    throw new InvalidPublicViewerPasswordError();
  }

  return password;
};

export const assert_public_viewer_password_result = (valid_password: boolean) => {
  if (!valid_password) {
    throw new InvalidPublicViewerPasswordError();
  }
};

export const public_viewer_session_expires_at = (now: Date) => (
  new Date(now.getTime() + public_viewer_session_ttl_ms).toISOString()
);
