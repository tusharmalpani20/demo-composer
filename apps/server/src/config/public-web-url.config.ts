const public_web_url_env = "DEMO_COMPOSER_PUBLIC_WEB_URL";

const absolute_http_url_error = `${public_web_url_env} must be an absolute http(s) URL when set`;
const origin_only_error = `${public_web_url_env} must be an origin without a path, query, or hash`;

const assert_http_origin = (value: string) => {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(absolute_http_url_error);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(absolute_http_url_error);
  }

  if (url.pathname !== "/" || url.search || url.hash) {
    throw new Error(origin_only_error);
  }

  return url.origin;
};

export const get_public_web_url = () => {
  const raw_value = process.env[public_web_url_env]?.trim();

  if (!raw_value) {
    return null;
  }

  return assert_http_origin(raw_value);
};

export const assert_public_web_url_config = () => {
  get_public_web_url();
};
