# Publish Links Are Multi-Version Artifact Manifests

One stable Artifact may have many independently configured Publish Links for different audiences. Each link selects one or more exact Edition/Published Artifact entries for that Artifact, owns their manual order, has exactly one default entry and one link-wide access policy, and exposes a canonical version-specific viewer path with a selector only for included versions.

Publishing creates immutable history and updates only links explicitly selected by the Project Editor or Admin; other links remain pinned. Link entries may be removed or atomically rolled back to an older Published Artifact from the same Edition without rewriting history, while drafts and unrelated Artifacts can never appear through the link.
