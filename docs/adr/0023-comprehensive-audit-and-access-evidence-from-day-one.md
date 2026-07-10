# Comprehensive Audit And Access Evidence From Day One

Every successfully committed state-changing transaction creates one append-only Audit Event with typed Audit Change Items, including committed autosaves, extension work, imports, migrations, and system actions. Meaningful protected reads, public-link views, downloads, authentication outcomes, authorization denials, and extension API access create separate append-only Access Events; transport noise remains operational telemetry.

Evidence commits atomically with mutations or before protected reads, is retained indefinitely while the Organization exists, and is queryable only through the accepted Owner, Project Admin, Editor activity, and Viewer history boundaries. Runtime database roles cannot update, delete, or truncate it, while restrictive foreign keys and coverage tests prevent silent loss or unaudited writes.

V1 does not provide timeline export, selective deletion, automatic expiry, legal purge, externally anchored cryptographic signatures, WORM storage, or compliance certification. The guarantee is application- and database-runtime-enforced append-only evidence, not immunity from a database superuser or infrastructure owner.
