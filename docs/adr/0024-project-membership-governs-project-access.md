# Project Membership Governs Project Access

Non-owner Organization Members require an active Project Membership with `project_admin`, `editor`, or `viewer` role to discover or access a Project. Organization Owners have implicit Project Admin capability across all Projects without duplicate membership rows, and a Project creator becomes its initial Project Admin without granting other Organization Members automatic access.

Project Versions inherit Project Membership rather than introducing per-version permissions. Project Admins control membership, Project settings, Project Version lifecycle, and safe asset purge; Editors author, checkpoint, carry forward, publish, and manage links; Viewers are read-only. Public Publish Link access remains independent from internal Project Membership.
