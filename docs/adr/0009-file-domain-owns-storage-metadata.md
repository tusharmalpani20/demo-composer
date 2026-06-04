# File Domain Owns Storage Metadata

Demo Composer uses a `file-domain` foundation package for stored file metadata while storage adapters handle local filesystem or future object storage details. Product domains such as capture, guide, demo, and publish reference files by `file_id` rather than storing raw filesystem paths or provider-specific keys directly.

