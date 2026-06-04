# Web First-Run Setup From Day One

Demo Composer will include a browser-based first-run setup screen from day one for self-hosted deployments. The setup screen creates the first user, default organization, and owner `org_user` when the instance is uninitialized. A CLI/bootstrap command remains available for automation, local development, and recovery, but the primary self-hosted onboarding path is web setup. The setup endpoint must be guarded by deployment/onboarding mode, only work before an owner exists, validate password safety server-side, and create records transactionally.
