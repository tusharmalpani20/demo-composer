export const CAPTURE_ASSET_TYPES = [
  "screenshot",
  "html_snapshot",
  "thumbnail",
  "redacted_screenshot",
] as const;
export type CaptureAssetType = (typeof CAPTURE_ASSET_TYPES)[number];

export const FILE_STORAGE_PROVIDERS = [
  "local",
  "external",
] as const;
export type FileStorageProvider = (typeof FILE_STORAGE_PROVIDERS)[number];
