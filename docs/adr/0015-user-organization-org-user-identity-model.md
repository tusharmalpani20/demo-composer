# User Organization Org User Identity Model

Demo Composer uses `user_schema.user` for portal login identity, `organization_schema.organization` for the tenant/workspace, and `organization_schema.org_user` for a user's membership inside one organization. Organization-owned records audit against `org_user.id`, which supports team invitations and multi-organization users later without changing the core schema.

