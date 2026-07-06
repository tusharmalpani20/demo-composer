import { FILE_STORAGE_PROVIDERS, type FileStorageProvider } from "@repo/constants";
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

const file_storage_providers = new Set<string>(FILE_STORAGE_PROVIDERS);

const normalize_storage_provider = (
  storage_provider: FileStorageProvider | undefined
) => {
  const normalized_storage_provider = storage_provider ?? "local";

  if (!file_storage_providers.has(normalized_storage_provider)) {
    throw new InvalidFileMetadataError();
  }

  return normalized_storage_provider;
};

const require_valid_size_bytes = (size_bytes: number) => {
  if (!Number.isInteger(size_bytes) || size_bytes < 0) {
    throw new InvalidFileMetadataError();
  }

  return size_bytes;
};

export const normalize_file_metadata = (
  input: FileMetadataInput
): NormalizedFileMetadata => {
  const mime_type = require_compact_string(input.mime_type);
  const storage_provider = normalize_storage_provider(input.storage_provider);
  const size_bytes = require_valid_size_bytes(input.size_bytes);

  if (!mime_type.toLowerCase().startsWith("image/")) {
    throw new InvalidFileMetadataError();
  }

  return {
    storage_provider,
    storage_key: require_compact_string(input.storage_key),
    mime_type,
    size_bytes,
    original_name: compact_optional_string(input.original_name),
    checksum_sha256: compact_optional_string(input.checksum_sha256),
    metadata: input.metadata,
  };
};
