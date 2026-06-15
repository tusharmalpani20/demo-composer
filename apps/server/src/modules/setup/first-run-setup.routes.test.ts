import cookie from "@fastify/cookie";
import fastify from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { describe, expect, it } from "vitest";
import { build_first_run_setup_routes } from "./first-run-setup.routes";
import {
  FirstRunSetupAlreadyCompletedError,
  FirstRunSetupUnavailableError,
  UnsafeOwnerPasswordError,
} from "./first-run-setup.service";

const build_test_app = async () => {
  const app = fastify();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  await app.register(cookie);
  return app;
};

describe("first-run setup routes", () => {
  it("rejects invalid setup payloads before calling the service", async () => {
    let service_called = false;
    const app = await build_test_app();
    await app.register(build_first_run_setup_routes({
      complete_first_run_setup: async () => {
        service_called = true;
        throw new Error("service should not be called");
      },
    }), { prefix: "/api/v1/setup" });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/setup/first-run",
      payload: {},
    });

    expect(response.statusCode).toBe(400);
    expect(service_called).toBe(false);
  });

  it("creates setup through the service and sets the web session cookie", async () => {
    const app = await build_test_app();
    await app.register(build_first_run_setup_routes({
      complete_first_run_setup: async (input) => ({
        session_token: "session-token",
        auth: {
          user: {
            id: "user_1",
            email: input.owner.email,
          },
          organization: {
            id: "organization_1",
            name: input.organization.name,
          },
          org_user: {
            id: "org_user_1",
            role: "owner",
          },
          session: {
            id: "session_1",
          },
        },
      }),
    }), { prefix: "/api/v1/setup" });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/setup/first-run",
      payload: {
        owner: {
          email: "owner@example.com",
          password: "safe local password",
          first_name: "Owner",
          last_name: "User",
        },
        organization: {
          name: "Acme",
        },
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.cookies).toContainEqual(expect.objectContaining({
      name: "demo_composer_session",
      value: "session-token",
      httpOnly: true,
      path: "/",
    }));
    expect(response.json()).toEqual({
      auth: {
        user: {
          id: "user_1",
          email: "owner@example.com",
        },
        organization: {
          id: "organization_1",
          name: "Acme",
        },
        org_user: {
          id: "org_user_1",
          role: "owner",
        },
        session: {
          id: "session_1",
        },
      },
    });
  });

  it("maps repeated first-run setup to conflict", async () => {
    const app = await build_test_app();
    await app.register(build_first_run_setup_routes({
      complete_first_run_setup: async () => {
        throw new FirstRunSetupAlreadyCompletedError();
      },
    }), { prefix: "/api/v1/setup" });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/setup/first-run",
      payload: {
        owner: {
          email: "owner@example.com",
          password: "safe local password",
        },
        organization: {
          name: "Acme",
        },
      },
    });

    expect(response.statusCode).toBe(409);
  });

  it("maps unavailable first-run setup to conflict", async () => {
    const app = await build_test_app();
    await app.register(build_first_run_setup_routes({
      complete_first_run_setup: async () => {
        throw new FirstRunSetupUnavailableError();
      },
    }), { prefix: "/api/v1/setup" });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/setup/first-run",
      payload: {
        owner: {
          email: "owner@example.com",
          password: "safe local password",
        },
        organization: {
          name: "Acme",
        },
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      error: {
        type: "first_run_setup_unavailable",
        message: "First-run setup is not available for this instance",
      },
    });
  });

  it("maps unsafe owner passwords to bad request", async () => {
    const app = await build_test_app();
    await app.register(build_first_run_setup_routes({
      complete_first_run_setup: async () => {
        throw new UnsafeOwnerPasswordError();
      },
    }), { prefix: "/api/v1/setup" });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/setup/first-run",
      payload: {
        owner: {
          email: "owner@example.com",
          password: "password",
        },
        organization: {
          name: "Acme",
        },
      },
    });

    expect(response.statusCode).toBe(400);
  });
});
