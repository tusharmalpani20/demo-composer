export type RuntimeMode = "development" | "test" | "production";

export const get_runtime_mode = (): RuntimeMode => {
  if (process.env.NODE_ENV === "production" || process.env.DEV_TYPE === "production") {
    return "production";
  }

  if (process.env.NODE_ENV === "test" || process.env.DEV_TYPE === "testing") {
    return "test";
  }

  return "development";
};

export const is_production_runtime = () => get_runtime_mode() === "production";
