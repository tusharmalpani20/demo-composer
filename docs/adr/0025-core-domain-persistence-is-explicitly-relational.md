# Core Domain Persistence Is Explicitly Relational

Core persistent product state uses typed columns, foreign keys, constraints, and type-specific relational child records. This includes Working Draft content, Guide Blocks/Steps/Annotations, Demo Scenes/Hotspots/Transitions, immutable Revision graphs, Published Artifact relationships, audit values, access context, membership, versioning, lineage, ordering, and asset protection.

The greenfield schema removes generic domain metadata JSONB, `guide_block.content`, and `published_artifact.snapshot_json` rather than carrying compatibility fields forward. JSON remains valid for HTTP transport, extension messages, manifests, and configuration, but it is not the database source of truth; a future persistent JSON exception requires its own accepted architecture decision.
