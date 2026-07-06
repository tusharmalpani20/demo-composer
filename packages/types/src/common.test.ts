import { describe, expect, it } from "vitest";
import {
  ApiErrorBodySchema,
  IdSchema,
  IsoDateTimeStringSchema,
  NonEmptyStringSchema,
  PositiveIntSchema,
  TrimmedIdParamSchema,
} from "./common";

describe("common API schemas", () => {
  it("keeps response IDs non-transforming while trimming route param IDs separately", () => {
    expect(IdSchema.parse(" project_1 ")).toBe(" project_1 ");
    expect(TrimmedIdParamSchema.parse(" project_1 ")).toBe("project_1");
  });

  it("validates common string, number, datetime, and error body shapes", () => {
    expect(NonEmptyStringSchema.safeParse("").success).toBe(false);
    expect(PositiveIntSchema.safeParse(3).success).toBe(true);
    expect(PositiveIntSchema.safeParse(0).success).toBe(false);
    expect(IsoDateTimeStringSchema.safeParse("2026-07-07T00:00:00.000Z").success).toBe(true);
    expect(IsoDateTimeStringSchema.safeParse("not-a-date").success).toBe(false);
    expect(ApiErrorBodySchema.parse({
      error: {
        type: "unauthenticated",
        message: "Authentication is required",
      },
    })).toEqual({
      error: {
        type: "unauthenticated",
        message: "Authentication is required",
      },
    });
  });
});
