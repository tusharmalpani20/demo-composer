import type { FileStorageProvider } from "@repo/constants";

export type FileMetadataInput = {
  storage_provider?: FileStorageProvider;
  storage_key: string;
  mime_type: string;
  size_bytes: number;
  original_name?: string | null;
  checksum_sha256?: string | null;
  metadata?: unknown;
};

export type NormalizedFileMetadata = {
  storage_provider: FileStorageProvider;
  storage_key: string;
  mime_type: string;
  size_bytes: number;
  original_name?: string | null;
  checksum_sha256?: string | null;
  metadata?: unknown;
};

export type ScreenshotUploadFileInput = {
  mime_type: string;
  declared_size_bytes?: number;
};
