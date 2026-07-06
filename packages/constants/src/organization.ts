export const ORGANIZATION_ROLES = [
  "owner",
  "member",
] as const;
export type OrganizationRole = (typeof ORGANIZATION_ROLES)[number];

export const ORGANIZATION_INVITE_STATUSES = [
  "pending",
  "accepted",
  "revoked",
  "expired",
] as const;
export type OrganizationInviteStatus = (typeof ORGANIZATION_INVITE_STATUSES)[number];

export const ORGANIZATION_MEMBER_STATUSES = [
  "active",
  "disabled",
] as const;
export type OrganizationMemberStatus = (typeof ORGANIZATION_MEMBER_STATUSES)[number];
