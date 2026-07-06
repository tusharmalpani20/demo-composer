import type {
  OrganizationInviteStatus,
  OrganizationMemberStatus,
  OrganizationRole,
} from "@repo/constants";

export type {
  OrganizationInviteStatus,
  OrganizationRole,
};

export type OrganizationMember = {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  role: OrganizationRole;
  status: OrganizationMemberStatus;
  created_at: string;
  updated_at: string;
};

export type OrganizationInvite = {
  id: string;
  organization_id: string;
  email: string;
  role: OrganizationRole;
  status: OrganizationInviteStatus;
  expires_at: string;
  accepted_at: string | null;
  accepted_user_id: string | null;
  created_by_id: string;
  updated_by_id: string;
  created_at: string;
  updated_at: string;
};

export type PublicOrganizationInvite = {
  id: string;
  organization_name: string;
  email: string;
  role: OrganizationRole;
  status: OrganizationInviteStatus;
  expires_at: string;
  requires_login: boolean;
};

export type OrganizationMemberListResponse = {
  members: OrganizationMember[];
};

export type OrganizationInviteListResponse = {
  invites: OrganizationInvite[];
};

export type OrganizationInviteCreateInput = {
  email: string;
  role?: OrganizationRole;
};

export type OrganizationInviteCreateResponse = {
  invite: OrganizationInvite;
  invite_token: string;
  invite_url: string;
};

export type OrganizationInviteUpdateResponse = {
  invite: OrganizationInvite;
};

export type PublicOrganizationInviteResponse = {
  invite: PublicOrganizationInvite;
};

export type AcceptOrganizationInviteInput = {
  password?: string;
  display_name?: string | null;
};
