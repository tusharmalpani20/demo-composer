# Deployment Aware Onboarding Mode

Demo Composer will make onboarding mode deployment-aware. Self-hosted installs default to first-run setup so an owner can create the first user and organization without email delivery or public signup. Hosted deployments default to signup/invite onboarding and must not expose first-run setup publicly. The application should model this through coarse configuration such as `DEMO_COMPOSER_DEPLOYMENT_MODE=self_hosted|hosted` and `DEMO_COMPOSER_ONBOARDING_MODE=first_run_setup|signup`, with a safe public instance status endpoint for clients.
