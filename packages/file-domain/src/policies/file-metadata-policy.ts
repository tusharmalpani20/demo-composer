import { InvalidFileMetadataError } from "../errors/file-domain-error";
import type {
  FileMetadataInput,
  NormalizedFileMetadata,
} from "../types/file-metadata";

export { InvalidFileMetadataError };

export const compact_optional_string = (value: string | null | undefined) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
};

export const require_compact_string = (value: string | undefined) => {
  const compacted = compact_optional_string(value);

  if (!compacted) {
    throw new InvalidFileMetadataError();
  }

  return compacted;
};

export const normalize_file_metadata = (
  input: FileMetadataInput
): NormalizedFileMetadata => {
  const mime_type = require_compact_string(input.mime_type);

  if (!mime_type.toLowerCase().startsWith("image/")) {
    throw new InvalidFileMetadataError();
  }

  return {
    storage_provider: input.storage_provider ?? "local",
    storage_key: require_compact_string(input.storage_key),
    mime_type,
    size_bytes: input.size_bytes,
    original_name: compact_optional_string(input.original_name),
    checksum_sha256: compact_optional_string(input.checksum_sha256),
    metadata: input.metadata,
  };
};
