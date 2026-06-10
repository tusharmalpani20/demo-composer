import type { FastifyInstance, FastifyPluginAsync, FastifyReply } from "fastify";
import {
  UnauthenticatedSessionError,
  type AuthContext,
} from "../authentication/session.service";
import { web_session_cookie_name } from "../authentication/session-cookie";
import {
  GuideHasNoPublishableBlocksError,
  GuideNotFoundError,
  GuideNotPublishableError,
  ProjectNotFoundError,
  PublishedAssetNotFoundError,
  PublishLinkNotFoundError,
  UnsupportedPublishedAssetStorageProviderError,
  type GuidePublishResult,
  type GuidePublishStatus,
  type PublishAuthContext,
  type PublicPublishResult,
  type PublishedAssetFileRead,
  type RevokedGuidePublishResult,
} from "./publish.service";

export type PublishRouteDependencies = {
  auth_service: {
    get_current_auth_context: (session_token?: string) => Promise<AuthContext>;
  };
  publish_service: {
    publish_guide: (input: {
      auth: PublishAuthContext;
      project_id: string;
      guide_id: string;
    }) => Promise<GuidePublishResult>;
    get_guide_publish_status: (input: {
      auth: PublishAuthContext;
      project_id: string;
      guide_id: string;
    }) => Promise<GuidePublishStatus>;
    revoke_guide_publish_link: (input: {
      auth: PublishAuthContext;
      project_id: string;
      guide_id: string;
    }) => Promise<RevokedGuidePublishResult>;
    resolve_public_publish_link: (input: {
      slug: string;
    }) => Promise<PublicPublishResult>;
    get_public_published_asset_file: (input: {
      slug: string;
      capture_asset_id: string;
    }) => Promise<PublishedAssetFileRead>;
  };
};

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

const publish_auth_context = (auth: AuthContext): PublishAuthContext => ({
  organization_id: auth.organization.id,
  actor_org_user_id: auth.org_user.id,
});

export const build_publish_routes = (
  dependencies: PublishRouteDependencies
): FastifyPluginAsync => {
  return async (fastify: FastifyInstance) => {
    const require_auth = async (session_token?: string) => (
      publish_auth_context(
        await dependencies.auth_service.get_current_auth_context(session_token)
      )
    );

    const handle_domain_error = (error: unknown, reply: FastifyReply) => {
      if (error instanceof UnauthenticatedSessionError) {
        return reply.status(401).send(unauthorized_response());
      }

      if (error instanceof ProjectNotFoundError) {
        return reply.status(404).send(error_response("project_not_found", "Project was not found"));
      }

      if (error instanceof GuideNotFoundError) {
        return reply.status(404).send(error_response("guide_not_found", "Guide was not found"));
      }

      if (error instanceof GuideNotPublishableError) {
        return reply.status(409).send(error_response("guide_not_publishable", "Guide is not publishable"));
      }

      if (error instanceof GuideHasNoPublishableBlocksError) {
        return reply.status(400).send(
          error_response("guide_has_no_publishable_blocks", "Guide has no publishable blocks")
        );
      }

      if (error instanceof PublishLinkNotFoundError) {
        return reply.status(404).send(error_response("publish_link_not_found", "Publish link was not found"));
      }

      if (error instanceof PublishedAssetNotFoundError) {
        return reply.status(404).send(error_response("published_asset_not_found", "Published asset was not found"));
      }

      if (error instanceof UnsupportedPublishedAssetStorageProviderError) {
        return reply.status(501).send(
          error_response(
            "unsupported_published_asset_storage_provider",
            "Published asset storage provider is not supported"
          )
        );
      }

      throw error;
    };

    fastify.post<{
      Params: {
        project_id: string;
        guide_id: string;
      };
    }>("/projects/:project_id/guides/:guide_id/publish", async (request, reply) => {
      try {
        const auth = await require_auth(request.cookies[web_session_cookie_name]);
        const result = await dependencies.publish_service.publish_guide({
          auth,
          project_id: request.params.project_id,
          guide_id: request.params.guide_id,
        });

        return reply.status(201).send(result);
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.get<{
      Params: {
        project_id: string;
        guide_id: string;
      };
    }>("/projects/:project_id/guides/:guide_id/publish", async (request, reply) => {
      try {
        const auth = await require_auth(request.cookies[web_session_cookie_name]);
        const result = await dependencies.publish_service.get_guide_publish_status({
          auth,
          project_id: request.params.project_id,
          guide_id: request.params.guide_id,
        });

        return reply.status(200).send(result);
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.delete<{
      Params: {
        project_id: string;
        guide_id: string;
      };
    }>("/projects/:project_id/guides/:guide_id/publish", async (request, reply) => {
      try {
        const auth = await require_auth(request.cookies[web_session_cookie_name]);
        const result = await dependencies.publish_service.revoke_guide_publish_link({
          auth,
          project_id: request.params.project_id,
          guide_id: request.params.guide_id,
        });

        return reply.status(200).send(result);
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.get<{
      Params: {
        slug: string;
      };
    }>("/public/publish-links/:slug", async (request, reply) => {
      try {
        const result = await dependencies.publish_service.resolve_public_publish_link({
          slug: request.params.slug,
        });

        return reply.status(200).send(result);
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.get<{
      Params: {
        slug: string;
        capture_asset_id: string;
      };
    }>("/public/publish-links/:slug/assets/:capture_asset_id/file", async (request, reply) => {
      try {
        const file = await dependencies.publish_service.get_public_published_asset_file({
          slug: request.params.slug,
          capture_asset_id: request.params.capture_asset_id,
        });

        return reply
          .status(200)
          .header("content-type", file.mime_type)
          .header("content-length", String(file.size_bytes))
          .send(file.stream);
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });
  };
};
