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
