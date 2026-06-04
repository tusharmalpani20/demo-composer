# Rebuild Foundation Domains Instead Of Reusing Server Modules

Auth, user, and organization will be rebuilt as domain packages rather than copied from the current server-module-centered implementation. The existing code is reference material only; rebuilding now avoids product domains depending on server-local models and establishes the domain-package pattern from the foundation upward.

