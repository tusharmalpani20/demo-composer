import {
  ORGANIZATION_INVITE_STATUSES,
  ORGANIZATION_MEMBER_STATUSES,
  ORGANIZATION_ROLES,
} from "@repo/constants";
import { z } from "zod";
import { AuthResponseSchema } from "./auth";
import {
  IdSchema,
  IsoDateTimeStringSchema,
} from "./common";

export const OrganizationMemberSchema = z.object({
  id: IdSchema,
  organization_id: IdSchema,
  user_id: IdSchema,
  email: z.string(),
  display_name: z.string(),
  role: z.enum(ORGANIZATION_ROLES),
  status: z.enum(ORGANIZATION_MEMBER_STATUSES),
  created_at: IsoDateTimeStringSchema,
});
export type OrganizationMember = z.infer<typeof OrganizationMemberSchema>;

export const OrganizationInviteSchema = z.object({
  id: IdSchema,
  organization_id: IdSchema,
  email: z.string(),
  role: z.enum(ORGANIZATION_ROLES),
  status: z.enum(ORGANIZATION_INVITE_STATUSES),
  expires_at: IsoDateTimeStringSchema,
  accepted_at: IsoDateTimeStringSchema.nullable(),
  accepted_user_id: IdSchema.nullable(),
  created_by_id: IdSchema,
  updated_by_id: IdSchema,
  created_at: IsoDateTimeStringSchema,
  updated_at: IsoDateTimeStringSchema,
});
export type OrganizationInvite = z.infer<typeof OrganizationInviteSchema>;

export const PublicOrganizationInviteSchema = z.object({
  id: IdSchema,
  organization_name: z.string(),
  email: z.string(),
  role: z.enum(ORGANIZATION_ROLES),
  status: z.enum(ORGANIZATION_INVITE_STATUSES),
  expires_at: IsoDateTimeStringSchema,
  requires_login: z.boolean(),
});
export type PublicOrganizationInvite = z.infer<typeof PublicOrganizationInviteSchema>;

export const CreateOrganizationInviteRequestSchema = z.object({
  email: z.string().trim().email(),
  role: z.enum(ORGANIZATION_ROLES).optional(),
}).passthrough();
export type OrganizationInviteCreateInput = z.infer<typeof CreateOrganizationInviteRequestSchema>;
export type CreateOrganizationInviteRequest = OrganizationInviteCreateInput;

export const AcceptOrganizationInviteRequestSchema = z.object({
  password: z.string().optional(),
  display_name: z.string().nullable().optional(),
}).passthrough();
export type AcceptOrganizationInviteInput = z.infer<typeof AcceptOrganizationInviteRequestSchema>;
export type AcceptOrganizationInviteRequest = AcceptOrganizationInviteInput;

export const OrganizationMemberListResponseSchema = z.object({
  members: z.array(OrganizationMemberSchema),
});
export type OrganizationMemberListResponse = z.infer<typeof OrganizationMemberListResponseSchema>;

export const OrganizationInviteListResponseSchema = z.object({
  invites: z.array(OrganizationInviteSchema),
});
export type OrganizationInviteListResponse = z.infer<typeof OrganizationInviteListResponseSchema>;

export const OrganizationInviteCreateResponseSchema = z.object({
  invite: OrganizationInviteSchema,
  invite_token: z.string().min(1),
  invite_url: z.string().min(1),
});
export type OrganizationInviteCreateResponse = z.infer<typeof OrganizationInviteCreateResponseSchema>;

export const OrganizationInviteUpdateResponseSchema = z.object({
  invite: OrganizationInviteSchema,
});
export type OrganizationInviteUpdateResponse = z.infer<typeof OrganizationInviteUpdateResponseSchema>;

export const PublicOrganizationInviteResponseSchema = z.object({
  invite: PublicOrganizationInviteSchema,
});
export type PublicOrganizationInviteResponse = z.infer<typeof PublicOrganizationInviteResponseSchema>;

export const AcceptOrganizationInviteResponseSchema = AuthResponseSchema;
export type AcceptOrganizationInviteResponse = z.infer<typeof AcceptOrganizationInviteResponseSchema>;
