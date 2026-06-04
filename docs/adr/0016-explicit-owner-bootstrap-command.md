# Explicit Owner Bootstrap Command

Demo Composer will create the first login user, default organization, and owner `org_user` through an explicit idempotent bootstrap command instead of a public first-run endpoint. This follows the proven `orca-echo` Administrator bootstrap shape while using Demo Composer's identity model: `user_schema.user`, `organization_schema.organization`, and `organization_schema.org_user`. The command must validate password safety, avoid printing secrets, avoid duplicate records on repeat runs, and preserve a rule that the system cannot be left without an owner.
