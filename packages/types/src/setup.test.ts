import { describe, expect, it } from "vitest";
import {
  FirstRunSetupRequestSchema,
  FirstRunSetupResponseSchema,
} from "./setup";

describe("first-run setup contract", () => {
  it("accepts the current first-run setup request and response shapes", () => {
    expect(FirstRunSetupRequestSchema.parse({
      owner: {
        email: "owner@example.com",
        password: "correct horse battery staple",
        first_name: null,
      },
      organization: {
        name: "Acme",
      },
    })).toEqual({
      owner: {
        email: "owner@example.com",
        password: "correct horse battery staple",
        first_name: null,
      },
      organization: {
        name: "Acme",
      },
    });

    expect(FirstRunSetupResponseSchema.parse({
      auth: {
        user: {
          id: "user_1",
        },
      },
    })).toEqual({
      auth: {
        user: {
          id: "user_1",
        },
      },
    });
  });

  it("rejects empty owner credentials and organization name", () => {
    expect(FirstRunSetupRequestSchema.safeParse({
      owner: {
        email: "",
        password: "",
      },
      organization: {
        name: "",
      },
    }).success).toBe(false);
  });
});
