export type NormalizedInstanceUrlResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

const invalid_url_message = "Enter a valid http:// or https:// instance URL.";

export const normalizeInstanceUrl = (value: string): NormalizedInstanceUrlResult => {
  const trimmed = value.trim();

  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return { ok: false, error: invalid_url_message };
  }

  try {
    const url = new URL(trimmed);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { ok: false, error: invalid_url_message };
    }

    return {
      ok: true,
      value: url.toString().replace(/\/+$/, ""),
    };
  } catch {
    return { ok: false, error: invalid_url_message };
  }
};

const buildFallbackCaptureSessionPath = (
  projectId: string,
  captureSessionId: string
) => (
  `/projects/${encodeURIComponent(projectId)}/capture-sessions/${encodeURIComponent(captureSessionId)}`
);

const safeRedirectPath = (
  redirectPath: string | null | undefined
) => {
  if (!redirectPath || !redirectPath.startsWith("/") || redirectPath.startsWith("//")) {
    return null;
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(redirectPath)) {
    return null;
  }

  return redirectPath;
};

export const buildPortalCaptureSessionUrl = (
  instanceUrl: string,
  redirectPath: string | null | undefined,
  projectId: string,
  captureSessionId: string
) => {
  const origin = instanceUrl.replace(/\/+$/, "");
  const path = safeRedirectPath(redirectPath)
    ?? buildFallbackCaptureSessionPath(projectId, captureSessionId);

  return `${origin}${path}`;
};
