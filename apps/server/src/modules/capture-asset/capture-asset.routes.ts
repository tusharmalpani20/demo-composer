import type { FastifyInstance, FastifyPluginAsync, FastifyReply } from "fastify";
import { z } from "zod";
import {
  UnauthenticatedSessionError,
  type AuthContext,
} from "../authentication/session.service";
import { web_session_cookie_name } from "../authentication/session-cookie";
import {
  CaptureAssetNotFoundError,
  CaptureSessionNotFoundError,
  FileStorageKeyConflictError,
  InvalidCaptureAssetInputError,
  UnsupportedCaptureAssetTypeError,
  type CaptureAsset,
  type CaptureAssetAuthContext,
  type CaptureAssetType,
  type CreateCaptureAssetInput,
} from "./capture-asset.service";

export type CaptureAssetRouteDependencies = {
  auth_service: {
    get_current_auth_context: (session_token?: string) => Promise<AuthContext>;
  };
  capture_asset_service: {
    create_capture_asset: (input: {
      auth: CaptureAssetAuthContext;
      project_id: string;
      capture_session_id: string;
      data: CreateCaptureAssetInput;
    }) => Promise<CaptureAsset>;
    list_capture_assets: (input: {
      auth: CaptureAssetAuthContext;
      project_id: string;
      capture_session_id: string;
      asset_type?: CaptureAssetType;
    }) => Promise<CaptureAsset[]>;
    get_capture_asset: (input: {
      auth: CaptureAssetAuthContext;
      project_id: string;
      capture_session_id: string;
      capture_asset_id: string;
    }) => Promise<CaptureAsset>;
    delete_capture_asset: (input: {
      auth: CaptureAssetAuthContext;
      project_id: string;
      capture_session_id: string;
      capture_asset_id: string;
    }) => Promise<void>;
  };
};

const asset_type_schema = z.enum([
  "screenshot",
  "html_snapshot",
  "thumbnail",
  "redacted_screenshot",
]);
const storage_provider_schema = z.enum(["local", "external"]);
const positive_int_schema = z.number().int().positive();
const positive_number_schema = z.number().positive();

const create_capture_asset_body_schema = z.object({
  asset_type: asset_type_schema,
  width: positive_int_schema.nullable().optional(),
  height: positive_int_schema.nullable().optional(),
  device_pixel_ratio: positive_number_schema.nullable().optional(),
  page_url: z.string().nullable().optional(),
  page_title: z.string().nullable().optional(),
  captured_at: z.string().datetime().nullable().optional(),
  metadata: z.unknown().optional(),
  file: z.object({
    storage_provider: storage_provider_schema.optional(),
    storage_key: z.string().trim().min(1),
    mime_type: z.string().trim().min(1),
    size_bytes: z.number().int().nonnegative(),
    original_name: z.string().nullable().optional(),
    checksum_sha256: z.string().nullable().optional(),
    metadata: z.unknown().optional(),
  }).passthrough(),
}).passthrough();

const list_query_schema = z.object({
  asset_type: asset_type_schema.optional(),
});

const unauthorized_response = () => ({
  error: {
    type: "unauthenticated",
    message: "Authentication is required",
  },
});

const error_response = (type: string, message: string) => ({
  error: {
    type,
    message,
  },
});

const capture_asset_auth_context = (auth: AuthContext) => ({
  organization_id: auth.organization.id,
  actor_org_user_id: auth.org_user.id,
});

const pick_create_capture_asset_data = (
  body: CreateCaptureAssetInput
): CreateCaptureAssetInput => {
  const data: CreateCaptureAssetInput = {
    asset_type: body.asset_type,
    file: {
      storage_key: body.file.storage_key,
      mime_type: body.file.mime_type,
      size_bytes: body.file.size_bytes,
    },
  };

  if (body.width !== undefined) {
    data.width = body.width;
  }
  if (body.height !== undefined) {
    data.height = body.height;
  }
  if (body.device_pixel_ratio !== undefined) {
    data.device_pixel_ratio = body.device_pixel_ratio;
  }
  if (body.page_url !== undefined) {
    data.page_url = body.page_url;
  }
  if (body.page_title !== undefined) {
    data.page_title = body.page_title;
  }
  if (body.captured_at !== undefined) {
    data.captured_at = body.captured_at;
  }
  if (body.metadata !== undefined) {
    data.metadata = body.metadata;
  }
  if (body.file.storage_provider !== undefined) {
    data.file.storage_provider = body.file.storage_provider;
  }
  if (body.file.original_name !== undefined) {
    data.file.original_name = body.file.original_name;
  }
  if (body.file.checksum_sha256 !== undefined) {
    data.file.checksum_sha256 = body.file.checksum_sha256;
  }
  if (body.file.metadata !== undefined) {
    data.file.metadata = body.file.metadata;
  }

  return data;
};

export const build_capture_asset_routes = (
  dependencies: CaptureAssetRouteDependencies
): FastifyPluginAsync => {
  return async (fastify: FastifyInstance) => {
    const require_auth = async (session_token?: string) => (
      capture_asset_auth_context(
        await dependencies.auth_service.get_current_auth_context(session_token)
      )
    );

    const handle_domain_error = (error: unknown, reply: FastifyReply) => {
      if (error instanceof UnauthenticatedSessionError) {
        return reply.status(401).send(unauthorized_response());
      }

      if (error instanceof CaptureSessionNotFoundError) {
        return reply.status(404).send(
          error_response("capture_session_not_found", "Capture session was not found")
        );
      }

      if (error instanceof CaptureAssetNotFoundError) {
        return reply.status(404).send(
          error_response("capture_asset_not_found", "Capture asset was not found")
        );
      }

      if (error instanceof UnsupportedCaptureAssetTypeError) {
        return reply.status(400).send(
          error_response(
            "unsupported_capture_asset_type",
            "Capture asset type is not supported yet"
          )
        );
      }

      if (error instanceof InvalidCaptureAssetInputError) {
        return reply.status(400).send(
          error_response("invalid_capture_asset", "Capture asset input is invalid")
        );
      }

      if (error instanceof FileStorageKeyConflictError) {
        return reply.status(409).send(
          error_response("file_storage_key_conflict", "File storage key already exists")
        );
      }

      throw error;
    };

    fastify.post<{
      Params: {
        project_id: string;
        capture_session_id: string;
      };
      Body: CreateCaptureAssetInput;
    }>("/:project_id/capture-sessions/:capture_session_id/assets", {
      schema: {
        body: create_capture_asset_body_schema,
      },
    }, async (request, reply) => {
      try {
        const auth = await require_auth(request.cookies[web_session_cookie_name]);
        const capture_asset = await dependencies.capture_asset_service.create_capture_asset({
          auth,
          project_id: request.params.project_id,
          capture_session_id: request.params.capture_session_id,
          data: pick_create_capture_asset_data(request.body),
        });
        return reply.status(201).send({ capture_asset });
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.get<{
      Params: {
        project_id: string;
        capture_session_id: string;
      };
      Querystring: {
        asset_type?: CaptureAssetType;
      };
    }>("/:project_id/capture-sessions/:capture_session_id/assets", {
      schema: {
        querystring: list_query_schema,
      },
    }, async (request, reply) => {
      try {
        const auth = await require_auth(request.cookies[web_session_cookie_name]);
        const capture_assets = await dependencies.capture_asset_service.list_capture_assets({
          auth,
          project_id: request.params.project_id,
          capture_session_id: request.params.capture_session_id,
          asset_type: request.query.asset_type,
        });
        return reply.status(200).send({ capture_assets });
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.get<{
      Params: {
        project_id: string;
        capture_session_id: string;
        id: string;
      };
    }>("/:project_id/capture-sessions/:capture_session_id/assets/:id", async (request, reply) => {
      try {
        const auth = await require_auth(request.cookies[web_session_cookie_name]);
        const capture_asset = await dependencies.capture_asset_service.get_capture_asset({
          auth,
          project_id: request.params.project_id,
          capture_session_id: request.params.capture_session_id,
          capture_asset_id: request.params.id,
        });
        return reply.status(200).send({ capture_asset });
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.delete<{
      Params: {
        project_id: string;
        capture_session_id: string;
        id: string;
      };
    }>("/:project_id/capture-sessions/:capture_session_id/assets/:id", async (request, reply) => {
      try {
        const auth = await require_auth(request.cookies[web_session_cookie_name]);
        await dependencies.capture_asset_service.delete_capture_asset({
          auth,
          project_id: request.params.project_id,
          capture_session_id: request.params.capture_session_id,
          capture_asset_id: request.params.id,
        });
        return reply.status(204).send();
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });
  };
};
