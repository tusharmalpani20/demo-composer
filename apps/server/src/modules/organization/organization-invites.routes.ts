import type { FastifyInstance, FastifyPluginAsync, FastifyReply } from "fastify";
import { z } from "zod";
import { get_public_web_url } from "../../config/public-web-url.config";
import { set_web_session_cookie } from "../authentication/session-cookie";
import { session_token_from_request } from "../authentication/request-session-token";
import {
  UnauthenticatedSessionError,
  type AuthContext,
} from "../authentication/session.service";
import {
  AcceptedInviteError,
  DuplicateActiveInviteError,
  ExistingUserLoginRequiredError,
  ExpiredInviteError,
  InviteEmailMismatchError,
  InviteNotFoundError,
  InvitePermissionError,
  RevokedInviteError,
  type OrgInvite,
  type OrgMember,
  type OrgMemberRole,
  type OrganizationInviteAuth,
} from "./organization-invites.service";

export type OrganizationInvitesRouteDependencies = {
  auth_service: {
    get_current_auth_context: (session_token?: string) => Promise<AuthContext>;
  };
  organization_invites_service: {
    list_members: (input: { auth: OrganizationInviteAuth }) => Promise<{ members: OrgMember[] }>;
    list_invites: (input: { auth: OrganizationInviteAuth }) => Promise<{ invites: OrgInvite[] }>;
    create_invite: (input: {
      auth: OrganizationInviteAuth;
      data: {
        email: string;
        role?: OrgMemberRole;
      };
    }) => Promise<{ invite: OrgInvite; invite_token: string }>;
    revoke_invite: (input: {
      auth: OrganizationInviteAuth;
      invite_id: string;
    }) => Promise<{ invite: OrgInvite }>;
    get_public_invite: (input: { token: string }) => Promise<{
      invite: {
        id: string;
        organization_name: string;
        email: string;
        role: OrgMemberRole;
        status: string;
        expires_at: string;
        requires_login: boolean;
      };
    }>;
    accept_invite: (input: {
      token: string;
      password?: string;
      display_name?: string | null;
      signed_in_user?: {
        id: string;
        email: string;
      } | null;
    }) => Promise<{
      session_token: string;
      auth: AuthContext;
    }>;
  };
};

const invite_body_schema = z.object({
  email: z.string().trim().email(),
  role: z.enum(["owner", "member"]).optional(),
}).passthrough();

const accept_invite_body_schema = z.object({
  password: z.string().optional(),
  display_name: z.string().nullable().optional(),
}).passthrough();

const error_response = (type: string, message: string) => ({
  error: {
    type,
    message,
  },
});

const invite_auth_context = (auth: AuthContext): OrganizationInviteAuth => ({
  organization_id: auth.organization.id,
  actor_org_user_id: auth.org_user.id,
  actor_role: auth.org_user.role,
});

const invite_url = (request: { protocol: string; hostname: string }, token: string) => (
  `${get_public_web_url() ?? `${request.protocol}://${request.hostname}`}/invites/${encodeURIComponent(token)}`
);

export const build_organization_invites_routes = (
  dependencies: OrganizationInvitesRouteDependencies
): FastifyPluginAsync => {
  return async (fastify: FastifyInstance) => {
    const require_auth = async (session_token?: string) => (
      invite_auth_context(
        await dependencies.auth_service.get_current_auth_context(session_token)
      )
    );

    const optional_auth = async (session_token?: string) => {
      if (!session_token) {
        return null;
      }

      try {
        return await dependencies.auth_service.get_current_auth_context(session_token);
      } catch (error) {
        if (error instanceof UnauthenticatedSessionError) {
          return null;
        }

        throw error;
      }
    };

    const handle_domain_error = (error: unknown, reply: FastifyReply) => {
      if (error instanceof UnauthenticatedSessionError) {
        return reply.status(401).send(error_response("unauthenticated", "Authentication is required"));
      }
      if (error instanceof InvitePermissionError) {
        return reply.status(403).send(error_response("invite_permission_denied", "Only organization owners can manage invites"));
      }
      if (error instanceof DuplicateActiveInviteError) {
        return reply.status(409).send(error_response("duplicate_active_invite", "An active invite already exists for this email"));
      }
      if (error instanceof InviteNotFoundError) {
        return reply.status(404).send(error_response("invite_not_found", "Invite was not found"));
      }
      if (error instanceof ExistingUserLoginRequiredError) {
        return reply.status(401).send(error_response("invite_existing_user_login_required", "Sign in to accept this invite"));
      }
      if (error instanceof InviteEmailMismatchError) {
        return reply.status(403).send(error_response("invite_email_mismatch", "Signed-in user does not match invite email"));
      }
      if (error instanceof AcceptedInviteError) {
        return reply.status(409).send(error_response("invite_already_accepted", "Invite has already been accepted"));
      }
      if (error instanceof RevokedInviteError) {
        return reply.status(410).send(error_response("invite_revoked", "Invite has been revoked"));
      }
      if (error instanceof ExpiredInviteError) {
        return reply.status(410).send(error_response("invite_expired", "Invite has expired"));
      }

      throw error;
    };

    fastify.get("/organization/members", async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        return reply.status(200).send(
          await dependencies.organization_invites_service.list_members({ auth })
        );
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.get("/organization/invites", async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        return reply.status(200).send(
          await dependencies.organization_invites_service.list_invites({ auth })
        );
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.post<{
      Body: {
        email: string;
        role?: OrgMemberRole;
      };
    }>("/organization/invites", {
      schema: {
        body: invite_body_schema,
      },
    }, async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        const result = await dependencies.organization_invites_service.create_invite({
          auth,
          data: {
            email: request.body.email,
            role: request.body.role,
          },
        });
        return reply.status(201).send({
          invite: result.invite,
          invite_token: result.invite_token,
          invite_url: invite_url(request, result.invite_token),
        });
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.delete<{
      Params: {
        invite_id: string;
      };
    }>("/organization/invites/:invite_id", async (request, reply) => {
      try {
        const auth = await require_auth(session_token_from_request(request));
        return reply.status(200).send(
          await dependencies.organization_invites_service.revoke_invite({
            auth,
            invite_id: request.params.invite_id,
          })
        );
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.get<{
      Params: {
        token: string;
      };
    }>("/public/invites/:token", async (request, reply) => {
      try {
        return reply.status(200).send(
          await dependencies.organization_invites_service.get_public_invite({
            token: request.params.token,
          })
        );
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });

    fastify.post<{
      Params: {
        token: string;
      };
      Body: {
        password?: string;
        display_name?: string | null;
      };
    }>("/public/invites/:token/accept", {
      schema: {
        body: accept_invite_body_schema,
      },
    }, async (request, reply) => {
      try {
        const auth = await optional_auth(session_token_from_request(request));
        const result = await dependencies.organization_invites_service.accept_invite({
          token: request.params.token,
          password: request.body.password,
          display_name: request.body.display_name,
          signed_in_user: auth ? {
            id: auth.user.id,
            email: auth.user.email,
          } : null,
        });
        set_web_session_cookie(reply, result.session_token);
        return reply.status(200).send({ auth: result.auth });
      } catch (error) {
        return handle_domain_error(error, reply);
      }
    });
  };
};
