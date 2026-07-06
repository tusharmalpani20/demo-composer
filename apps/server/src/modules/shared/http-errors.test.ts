import { describe, expect, it } from "vitest";
import {
  error_response,
  unauthorized_response,
} from "./http-errors";

describe("server http error responses", () => {
  it("builds the standard unauthenticated response envelope", () => {
    expect(unauthorized_response()).toEqual({
      error: {
        type: "unauthenticated",
        message: "Authentication is required",
      },
    });
  });

  it("builds typed error response envelopes", () => {
    expect(error_response("project_not_found", "Project was not found")).toEqual({
      error: {
        type: "project_not_found",
        message: "Project was not found",
      },
    });
  });
});
