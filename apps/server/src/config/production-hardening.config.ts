const positive_integer_from_env = (name: string, default_value: number) => {
  const raw_value = process.env[name];

  if (raw_value === undefined || raw_value === "") {
    return default_value;
  }

  const parsed_value = Number(raw_value);

  if (!Number.isInteger(parsed_value) || parsed_value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return parsed_value;
};

export const get_json_body_limit_bytes = () => (
  positive_integer_from_env("DEMO_COMPOSER_JSON_BODY_LIMIT_BYTES", 1024 * 1024)
);

export const get_max_screenshot_upload_bytes = () => (
  positive_integer_from_env("DEMO_COMPOSER_MAX_SCREENSHOT_UPLOAD_BYTES", 10 * 1024 * 1024)
);

export const get_rate_limit_config = () => ({
  max_attempts: positive_integer_from_env("DEMO_COMPOSER_RATE_LIMIT_MAX_ATTEMPTS", 20),
  window_ms: positive_integer_from_env("DEMO_COMPOSER_RATE_LIMIT_WINDOW_MS", 60_000),
});
