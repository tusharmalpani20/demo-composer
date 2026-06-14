import { ulid } from "ulid";
import { render_guide_html_export } from "./guide-html-export";
import { build_guide_zip_export } from "./guide-zip-export";

export type GuideAuthContext = {
  organization_id: string;
  actor_org_user_id: string;
};

export type GuideStatus = "draft" | "archived";
export type GuideBlockType = "step" | "header" | "paragraph" | "tip" | "alert" | "capture" | "divider" | "gif";
export type GuideSourceEventType = "navigation" | "click" | "input" | "capture" | "note";

export type Guide = {
  id: string;
  organization_id: string;
  project_id: string;
  source_capture_session_id: string | null;
  title: string;
  description: string | null;
  status: GuideStatus;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: string;
  updated_at: string;
};

export type GuideStep = {
  id: string;
  organization_id: string;
  project_id: string;
  guide_id: string;
  guide_block_id: string;
  source_capture_session_id: string | null;
  source_capture_event_id: string | null;
  source_capture_asset_id: string | null;
  title: string;
  body: string | null;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: string;
  updated_at: string;
};

export type GuideBlock = {
  id: string;
  organization_id: string;
  project_id: string;
  guide_id: string;
  source_capture_session_id: string | null;
  source_capture_event_id: string | null;
  source_capture_asset_id: string | null;
  selected_capture_asset_id: string | null;
  screenshot_hidden: boolean;
  display_capture_asset_id: string | null;
  block_type: GuideBlockType;
  content: GuideBlockContent | null;
  block_index: number;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: string;
  updated_at: string;
  step: GuideStep | null;
};

export type GuideBlockContent = {
  title?: string | null;
  body?: string | null;
  annotations?: GuideScreenshotAnnotation[] | null;
};

export type GuideScreenshotAnnotation = {
  id: string;
  type: "highlight";
  x: number;
  y: number;
  width: number;
  height: number;
};

export type GuideSourceCaptureAsset = {
  id: string;
  capture_session_id: string;
  asset_type: "screenshot" | "html_snapshot" | "thumbnail" | "redacted_screenshot";
  width: number | null;
  height: number | null;
  device_pixel_ratio: number | null;
  page_url: string | null;
  page_title: string | null;
  captured_at: string;
  file_url: string;
  file: {
    id: string;
    original_name: string | null;
    mime_type: string;
    size_bytes: number;
  };
};

export type GuideDetail = {
  guide: Guide;
  guide_blocks: GuideBlock[];
  source_capture_assets: GuideSourceCaptureAsset[];
};

export type GuideMarkdownExport = {
  filename: string;
  markdown: string;
};

export type GuideHtmlZipExport = {
  filename: string;
  mime_type: "application/zip";
  stream: NodeJS.ReadableStream;
  size_bytes: number;
};

export type GuideExportAssetFile = {
  capture_asset_id: string;
  storage_provider: "local" | "external";
  storage_key: string;
  mime_type: string;
  original_name: string | null;
  size_bytes: number;
};

export type GuideSourceEvent = {
  id: string;
  event_type: GuideSourceEventType;
  event_index: number;
  capture_asset_id: string | null;
  page_url: string | null;
  page_title: string | null;
  target_label: string | null;
  target_role: string | null;
  target_text: string | null;
  note: string | null;
};

export type CreateGuideFromCaptureInput = {
  title: string;
  description?: string | null;
  selected_capture_event_ids?: string[];
};

export type UpdateGuideInput = {
  title?: string;
  description?: string | null;
  status?: GuideStatus;
};

export type UpdateGuideStepInput = {
  title?: string;
  body?: string | null;
};

export type CreateGuideBlockInput = {
  block_type: GuideBlockType;
  position?: {
    placement: "before" | "after";
    guide_block_id: string;
  } | null;
  step?: {
    title?: string;
    body?: string | null;
  } | null;
  content?: GuideBlockContent | null;
};

export type UpdateGuideBlockInput = {
  content?: GuideBlockContent | null;
};

export type UpdateGuideBlockScreenshotInput = {
  capture_asset_id: string | null;
};

export type UpdateGuideBlockAnnotationsInput = {
  annotations: Array<{
    id?: string;
    type: "highlight";
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
};

export type PrepareGuideBlockScreenshotUploadResult = {
  capture_session_id: string;
};

export type NormalizedUpdateGuideInput = {
  title?: string;
  description?: string | null;
  status?: GuideStatus;
};

export type NormalizedUpdateGuideStepInput = {
  title?: string;
  body?: string | null;
};

export type NormalizedCreateGuideBlockInput = {
  block_type: "step" | "header" | "paragraph" | "tip" | "alert" | "divider";
  position?: {
    placement: "before" | "after";
    guide_block_id: string;
  };
  step?: {
    title: string;
    body: string | null;
  };
  content?: GuideBlockContent | null;
};

export type NormalizedUpdateGuideBlockInput = {
  content: GuideBlockContent;
};

export type NormalizedUpdateGuideBlockScreenshotInput = {
  selected_capture_asset_id: string | null;
  screenshot_hidden: boolean;
};

export type NormalizedUpdateGuideBlockAnnotationsInput = {
  content: GuideBlockContent;
};

export type NormalizedCreateGuideFromCaptureInput = {
  title: string;
  description: string | null;
  blocks: Array<{
    block_type: GuideBlockType;
    block_index: number;
    source_capture_event_id: string;
    source_capture_asset_id: string | null;
    step: {
      title: string;
      body: string | null;
    };
  }>;
};

export type GuideRepository = {
  project_exists: (input: {
    organization_id: string;
    project_id: string;
  }) => Promise<boolean>;
  capture_session_exists: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
  }) => Promise<boolean>;
  list_source_capture_events: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    selected_capture_event_ids?: string[];
  }) => Promise<GuideSourceEvent[]>;
  list_active_capture_asset_ids: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    capture_asset_ids: string[];
  }) => Promise<string[]>;
  active_screenshot_asset_exists: (input: {
    organization_id: string;
    project_id: string;
    capture_asset_id: string;
  }) => Promise<boolean>;
  create_guide_from_capture: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    actor_org_user_id: string;
    data: NormalizedCreateGuideFromCaptureInput;
  }) => Promise<GuideDetail>;
  list_guides: (input: {
    organization_id: string;
    project_id: string;
  }) => Promise<Guide[]>;
  find_guide_detail: (input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
  }) => Promise<GuideDetail | null>;
  update_guide: (input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
    actor_org_user_id: string;
    data: NormalizedUpdateGuideInput;
  }) => Promise<Guide>;
  find_guide_step: (input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
    guide_step_id: string;
  }) => Promise<GuideStep | null>;
  update_guide_step: (input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
    guide_step_id: string;
    actor_org_user_id: string;
    data: NormalizedUpdateGuideStepInput;
  }) => Promise<GuideStep>;
  list_guide_blocks: (input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
  }) => Promise<GuideBlock[]>;
  reorder_guide_blocks: (input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
    actor_org_user_id: string;
    block_ids: string[];
  }) => Promise<GuideBlock[]>;
  create_guide_block: (input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
    actor_org_user_id: string;
    data: NormalizedCreateGuideBlockInput;
  }) => Promise<GuideBlock[]>;
  update_guide_block: (input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
    guide_block_id: string;
    actor_org_user_id: string;
    data: NormalizedUpdateGuideBlockInput;
  }) => Promise<GuideBlock>;
  update_guide_block_screenshot: (input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
    guide_block_id: string;
    actor_org_user_id: string;
    data: NormalizedUpdateGuideBlockScreenshotInput;
  }) => Promise<GuideBlock>;
  update_guide_block_annotations: (input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
    guide_block_id: string;
    actor_org_user_id: string;
    data: NormalizedUpdateGuideBlockAnnotationsInput;
  }) => Promise<GuideBlock>;
  delete_guide_block: (input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
    guide_block_id: string;
    actor_org_user_id: string;
  }) => Promise<boolean>;
  find_guide_export_asset_files: (input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
    capture_asset_ids: string[];
  }) => Promise<GuideExportAssetFile[]>;
};

export type GuideFileStorage = {
  get: (input: { storage_key: string }) => Promise<{
    stream: NodeJS.ReadableStream;
    size_bytes: number;
  }>;
};

export class ProjectNotFoundError extends Error {
  constructor() {
    super("Project was not found");
  }
}

export class CaptureSessionNotFoundError extends Error {
  constructor() {
    super("Capture session was not found");
  }
}

export class CaptureEventNotFoundError extends Error {
  constructor() {
    super("Capture event was not found");
  }
}

export class GuideNotFoundError extends Error {
  constructor() {
    super("Guide was not found");
  }
}

export class GuideNotEditableError extends Error {
  constructor() {
    super("Guide is not editable");
  }
}

export class GuideStepNotFoundError extends Error {
  constructor() {
    super("Guide step was not found");
  }
}

export class GuideBlockNotFoundError extends Error {
  constructor() {
    super("Guide block was not found");
  }
}

export class InvalidGuideInputError extends Error {
  constructor() {
    super("Guide input is invalid");
  }
}

export class InvalidGuideStepInputError extends Error {
  constructor() {
    super("Guide step input is invalid");
  }
}

export class InvalidGuideBlockOrderError extends Error {
  constructor() {
    super("Guide block order is invalid");
  }
}

export class InvalidGuideBlockContentError extends Error {
  constructor() {
    super("Guide block content is invalid");
  }
}

export class InvalidGuideBlockScreenshotError extends Error {
  constructor() {
    super("Guide block screenshot is invalid");
  }
}

export class GuideExportFileNotFoundError extends Error {
  constructor() {
    super("Guide export file was not found");
  }
}

export class UnsupportedGuideExportStorageProviderError extends Error {
  constructor() {
    super("Guide export storage provider is not supported");
  }
}

const compact_optional_string = (value: string | null | undefined) => {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
};

const normalize_update_guide_step_input = (
  input: UpdateGuideStepInput
): NormalizedUpdateGuideStepInput => {
  const normalized: NormalizedUpdateGuideStepInput = {};

  if (input.title !== undefined) {
    const title = compact_optional_string(input.title);

    if (!title) {
      throw new InvalidGuideStepInputError();
    }

    normalized.title = cap_title(title);
  }

  if (input.body !== undefined) {
    normalized.body = compact_optional_string(input.body);
  }

  if (!has_keys(normalized)) {
    throw new InvalidGuideStepInputError();
  }

  return normalized;
};

const normalize_block_ids = (block_ids: string[]) => {
  const normalized = block_ids.map((id) => id.trim()).filter(Boolean);

  if (normalized.length === 0) {
    throw new InvalidGuideBlockOrderError();
  }

  if (new Set(normalized).size !== normalized.length) {
    throw new InvalidGuideBlockOrderError();
  }

  return normalized;
};

const normalize_position = (position: CreateGuideBlockInput["position"]) => {
  if (!position) {
    return undefined;
  }

  const guide_block_id = compact_optional_string(position.guide_block_id);

  if (!guide_block_id || !["before", "after"].includes(position.placement)) {
    throw new InvalidGuideBlockContentError();
  }

  return {
    placement: position.placement,
    guide_block_id,
  };
};

const normalize_block_content = (
  block_type: "header" | "paragraph" | "tip" | "alert" | "divider",
  content: GuideBlockContent | null | undefined
) => {
  const title = compact_optional_string(content?.title);
  const body = compact_optional_string(content?.body);

  if (block_type === "header") {
    if (!title) {
      throw new InvalidGuideBlockContentError();
    }

    return { title };
  }

  if (block_type === "paragraph") {
    if (title || !body) {
      throw new InvalidGuideBlockContentError();
    }

    return { body };
  }

  if (block_type === "divider") {
    if (title || body) {
      throw new InvalidGuideBlockContentError();
    }

    return null;
  }

  if (!title && !body) {
    throw new InvalidGuideBlockContentError();
  }

  return { title, body };
};

const normalize_editable_block_content = (
  block_type: "header" | "paragraph" | "tip" | "alert",
  content: GuideBlockContent | null | undefined
) => {
  const normalized = normalize_block_content(block_type, content);

  if (!normalized) {
    throw new InvalidGuideBlockContentError();
  }

  return normalized;
};

const normalize_create_guide_block_input = (
  input: CreateGuideBlockInput
): NormalizedCreateGuideBlockInput => {
  const position = normalize_position(input.position);

  if (input.block_type === "step") {
    const title = compact_optional_string(input.step?.title);

    if (!title) {
      throw new InvalidGuideBlockContentError();
    }

    return {
      block_type: "step",
      ...(position ? { position } : {}),
      step: {
        title: cap_title(title),
        body: compact_optional_string(input.step?.body),
      },
    };
  }

  if (
    input.block_type === "header"
    || input.block_type === "paragraph"
    || input.block_type === "tip"
    || input.block_type === "alert"
    || input.block_type === "divider"
  ) {
    return {
      block_type: input.block_type,
      ...(position ? { position } : {}),
      content: normalize_block_content(input.block_type, input.content),
    };
  }

  throw new InvalidGuideBlockContentError();
};

const normalize_update_guide_block_input = (
  block_type: GuideBlockType,
  input: UpdateGuideBlockInput
): NormalizedUpdateGuideBlockInput => {
  if (block_type !== "header" && block_type !== "paragraph" && block_type !== "tip" && block_type !== "alert") {
    throw new InvalidGuideBlockContentError();
  }

  return {
    content: normalize_editable_block_content(block_type, input.content),
  };
};

const normalize_update_guide_block_screenshot_input = (
  input: UpdateGuideBlockScreenshotInput
): NormalizedUpdateGuideBlockScreenshotInput => {
  const capture_asset_id = compact_optional_string(input.capture_asset_id);

  if (!capture_asset_id) {
    return {
      selected_capture_asset_id: null,
      screenshot_hidden: true,
    };
  }

  return {
    selected_capture_asset_id: capture_asset_id,
    screenshot_hidden: false,
  };
};

const annotation_id = () => `ann_${ulid()}`;

const normalize_update_guide_block_annotations_input = (
  block: GuideBlock,
  input: UpdateGuideBlockAnnotationsInput
): NormalizedUpdateGuideBlockAnnotationsInput => {
  if (block.block_type !== "step" || !block.display_capture_asset_id || block.screenshot_hidden) {
    throw new InvalidGuideBlockContentError();
  }

  if (!Array.isArray(input.annotations) || input.annotations.length > 10) {
    throw new InvalidGuideBlockContentError();
  }

  const existing_ids = new Set((block.content?.annotations ?? []).map((annotation) => annotation.id));
  const seen_input_ids = new Set<string>();
  const annotations = input.annotations.map((annotation) => {
    const x = Number(annotation.x);
    const y = Number(annotation.y);
    const width = Number(annotation.width);
    const height = Number(annotation.height);

    if (
      annotation.type !== "highlight"
      || !Number.isFinite(x)
      || !Number.isFinite(y)
      || !Number.isFinite(width)
      || !Number.isFinite(height)
      || x < 0
      || y < 0
      || width <= 0
      || height <= 0
      || x + width > 1
      || y + height > 1
    ) {
      throw new InvalidGuideBlockContentError();
    }

    const id = compact_optional_string(annotation.id);

    if (id && !existing_ids.has(id)) {
      throw new InvalidGuideBlockContentError();
    }

    if (id && seen_input_ids.has(id)) {
      throw new InvalidGuideBlockContentError();
    }

    if (id) {
      seen_input_ids.add(id);
    }

    return {
      id: id ?? annotation_id(),
      type: "highlight" as const,
      x,
      y,
      width,
      height,
    };
  });

  return {
    content: {
      ...(block.content ?? {}),
      annotations,
    },
  };
};

const has_keys = (value: Record<string, unknown>) => Object.keys(value).length > 0;

const normalize_update_guide_input = (input: UpdateGuideInput): NormalizedUpdateGuideInput => {
  const normalized: NormalizedUpdateGuideInput = {};

  if (input.title !== undefined) {
    const title = compact_optional_string(input.title);

    if (!title) {
      throw new InvalidGuideInputError();
    }

    normalized.title = cap_title(title);
  }

  if (input.description !== undefined) {
    normalized.description = compact_optional_string(input.description);
  }

  if (input.status !== undefined) {
    if (input.status !== "archived") {
      throw new InvalidGuideInputError();
    }

    normalized.status = input.status;
  }

  if (!has_keys(normalized)) {
    throw new InvalidGuideInputError();
  }

  return normalized;
};

const first_present = (...values: Array<string | null | undefined>) => {
  for (const value of values) {
    const compacted = compact_optional_string(value);

    if (compacted) {
      return compacted;
    }
  }

  return null;
};

const cap_title = (value: string) => (
  value.length > 180 ? value.slice(0, 180) : value
);

const default_public_base_url = "http://localhost:3000";

const normalize_line_endings = (value: string) => (
  value.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
);

const escape_markdown_text = (value: string) => (
  normalize_line_endings(value).replace(/([\\[\]])/g, "\\$1").trim()
);

const markdown_percent = (value: number) => `${Number((value * 100).toFixed(4))}%`;

const markdown_asset_url = (file_url: string, public_base_url: string) => {
  if (/^https?:\/\//i.test(file_url)) {
    return encodeURI(file_url).replace(/\(/g, "%28").replace(/\)/g, "%29");
  }

  const base = public_base_url.replace(/\/$/, "");
  const path = file_url.startsWith("/") ? file_url : `/${file_url}`;

  return encodeURI(`${base}${path}`).replace(/\(/g, "%28").replace(/\)/g, "%29");
};

const markdown_filename = (guide: Guide) => {
  const slug = guide.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return `${slug || `guide-${guide.id}`}.md`;
};

const html_zip_filename = (guide: Guide) => {
  const slug = guide.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return `${slug || `guide-${guide.id}`}-html-export.zip`;
};

const step_number_for_block = (blocks: GuideBlock[], target: GuideBlock) => (
  blocks
    .filter((block) => block.block_type === "step" && block.block_index <= target.block_index)
    .length
);

const markdown_asset_alt = (
  asset: GuideSourceCaptureAsset,
  fallback_title: string,
  step_number: number
) => (
  escape_markdown_text(asset.page_title ?? asset.file.original_name ?? fallback_title ?? `Step ${step_number} screenshot`)
);

const markdown_sections = (...sections: Array<string | null | undefined>) => (
  sections
    .map((section) => section?.trim())
    .filter((section): section is string => Boolean(section))
    .join("\n\n")
);

const render_annotations_markdown = (annotations: GuideScreenshotAnnotation[] | null | undefined) => {
  if (!annotations?.length) {
    return null;
  }

  return [
    "Highlights:",
    "",
    ...annotations.map((annotation, index) => (
      `- Highlight ${index + 1}: x ${markdown_percent(annotation.x)}, y ${markdown_percent(annotation.y)}, width ${markdown_percent(annotation.width)}, height ${markdown_percent(annotation.height)}`
    )),
  ].join("\n");
};

const render_blockquote_markdown = (
  label: "Tip" | "Alert",
  content: GuideBlockContent | null
) => {
  const title = compact_optional_string(content?.title);
  const body = compact_optional_string(content?.body);
  const label_line = title
    ? `> **${label}: ${escape_markdown_text(title)}**`
    : `> **${label}:**${body ? ` ${escape_markdown_text(body)}` : ""}`;

  if (!body || !title) {
    return label_line;
  }

  return `${label_line}\n> ${escape_markdown_text(body).replace(/\n/g, "\n> ")}`;
};

const render_guide_block_markdown = (
  blocks: GuideBlock[],
  block: GuideBlock,
  assets_by_id: Map<string, GuideSourceCaptureAsset>,
  public_base_url: string
) => {
  if (block.block_type === "header" && block.content?.title) {
    return `## ${escape_markdown_text(block.content.title)}`;
  }

  if (block.block_type === "paragraph" && block.content?.body) {
    return escape_markdown_text(block.content.body);
  }

  if (block.block_type === "tip") {
    return render_blockquote_markdown("Tip", block.content);
  }

  if (block.block_type === "alert") {
    return render_blockquote_markdown("Alert", block.content);
  }

  if (block.block_type === "divider") {
    return "---";
  }

  if (block.block_type === "step" && block.step) {
    const step_number = step_number_for_block(blocks, block);
    const asset = block.display_capture_asset_id
      ? assets_by_id.get(block.display_capture_asset_id)
      : undefined;
    const screenshot_markdown = asset
      ? `![${markdown_asset_alt(asset, block.step.title, step_number)}](${markdown_asset_url(asset.file_url, public_base_url)})`
      : null;

    return markdown_sections(
      `## ${step_number}. ${escape_markdown_text(block.step.title)}`,
      block.step.body ? escape_markdown_text(block.step.body) : null,
      screenshot_markdown,
      render_annotations_markdown(asset ? block.content?.annotations : null)
    );
  }

  return `<!-- Unsupported guide block: ${block.block_type} -->`;
};

const render_guide_markdown = (
  detail: GuideDetail,
  public_base_url: string
) => {
  const sorted_blocks = [...detail.guide_blocks].sort((left, right) => left.block_index - right.block_index);
  const assets_by_id = new Map(detail.source_capture_assets.map((asset) => [asset.id, asset]));
  const sections = [
    `# ${escape_markdown_text(detail.guide.title)}`,
    detail.guide.description ? escape_markdown_text(detail.guide.description) : null,
    ...sorted_blocks.map((block) => render_guide_block_markdown(sorted_blocks, block, assets_by_id, public_base_url)),
  ];

  return `${markdown_sections(...sections)}\n`;
};

const quoted = (value: string) => `"${value}"`;

const generate_capture_step_title = (event: GuideSourceEvent) => {
  const title_source = first_present(event.page_title, event.page_url);

  if (!title_source) {
    return "Capture this screen";
  }

  return cap_title(`Capture ${quoted(title_source)}`);
};

const generate_capture_step_body = (event: GuideSourceEvent) => {
  const page_url = first_present(event.page_url);

  if (!page_url) {
    return null;
  }

  if (first_present(event.page_title)) {
    return `Captured from ${page_url}.`;
  }

  return "Captured from this page.";
};

const generate_step_title = (event: GuideSourceEvent) => {
  const target = first_present(
    event.target_label,
    event.target_text,
    event.target_role,
    event.page_title
  );

  switch (event.event_type) {
    case "note":
      return cap_title(first_present(event.note) ?? "Review this note");
    case "click":
      return cap_title(`Click ${quoted(target ?? "the highlighted element")}`);
    case "input":
      return cap_title(`Enter the required value in ${quoted(target ?? "the field")}`);
    case "navigation":
      return cap_title(`Navigate to ${quoted(first_present(event.page_title, event.page_url) ?? "the page")}`);
    case "capture":
      return generate_capture_step_title(event);
  }
};

const generate_step_body = (event: GuideSourceEvent) => {
  switch (event.event_type) {
    case "capture":
      return generate_capture_step_body(event);
    case "note":
    case "click":
    case "input":
    case "navigation":
      return null;
  }
};

const normalize_create_input = (input: CreateGuideFromCaptureInput) => {
  const title = compact_optional_string(input.title);

  if (!title) {
    throw new InvalidGuideInputError();
  }

  const selected_capture_event_ids = input.selected_capture_event_ids?.map((id) => id.trim()).filter(Boolean);

  if (selected_capture_event_ids && new Set(selected_capture_event_ids).size !== selected_capture_event_ids.length) {
    throw new InvalidGuideInputError();
  }

  return {
    title: cap_title(title),
    description: compact_optional_string(input.description),
    selected_capture_event_ids,
  };
};

export const build_guide_service = (
  repository: GuideRepository,
  options: {
    public_base_url?: string;
    file_storage?: GuideFileStorage;
  } = {}
) => {
  const public_base_url = compact_optional_string(options.public_base_url) ?? default_public_base_url;

  const ensure_project_exists = async (input: {
    organization_id: string;
    project_id: string;
  }) => {
    if (!await repository.project_exists(input)) {
      throw new ProjectNotFoundError();
    }
  };

  const ensure_capture_session_exists = async (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
  }) => {
    if (!await repository.capture_session_exists(input)) {
      throw new CaptureSessionNotFoundError();
    }
  };

  const create_guide_from_capture = async (input: {
    auth: GuideAuthContext;
    project_id: string;
    capture_session_id: string;
    data: CreateGuideFromCaptureInput;
  }) => {
    const normalized = normalize_create_input(input.data);
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
    };

    await ensure_project_exists(scope);
    await ensure_capture_session_exists(scope);

    const source_events = await repository.list_source_capture_events({
      ...scope,
      selected_capture_event_ids: normalized.selected_capture_event_ids,
    });

    if (
      normalized.selected_capture_event_ids
      && source_events.length !== normalized.selected_capture_event_ids.length
    ) {
      throw new CaptureEventNotFoundError();
    }

    const capture_asset_ids = [
      ...new Set(source_events.map((event) => event.capture_asset_id).filter((id): id is string => Boolean(id))),
    ];
    const active_capture_asset_ids = new Set(
      await repository.list_active_capture_asset_ids({
        ...scope,
        capture_asset_ids,
      })
    );

    return repository.create_guide_from_capture({
      ...scope,
      actor_org_user_id: input.auth.actor_org_user_id,
      data: {
        title: normalized.title,
        description: normalized.description,
        blocks: source_events.map((event, index) => ({
          block_type: "step",
          block_index: index + 1,
          source_capture_event_id: event.id,
          source_capture_asset_id: event.capture_asset_id && active_capture_asset_ids.has(event.capture_asset_id)
            ? event.capture_asset_id
            : null,
          step: {
            title: generate_step_title(event),
            body: generate_step_body(event),
          },
        })),
      },
    });
  };

  const list_guides = async (input: {
    auth: GuideAuthContext;
    project_id: string;
  }) => {
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    };
    await ensure_project_exists(scope);

    return repository.list_guides(scope);
  };

  const get_guide_detail = async (input: {
    auth: GuideAuthContext;
    project_id: string;
    guide_id: string;
  }) => {
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    };
    await ensure_project_exists(scope);

    const guide_detail = await repository.find_guide_detail({
      ...scope,
      guide_id: input.guide_id,
    });

    if (!guide_detail) {
      throw new GuideNotFoundError();
    }

    return guide_detail;
  };

  const export_guide_markdown = async (input: {
    auth: GuideAuthContext;
    project_id: string;
    guide_id: string;
  }): Promise<GuideMarkdownExport> => {
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    };
    await ensure_project_exists(scope);

    const guide_detail = await repository.find_guide_detail({
      ...scope,
      guide_id: input.guide_id,
    });

    if (!guide_detail) {
      throw new GuideNotFoundError();
    }

    return {
      filename: markdown_filename(guide_detail.guide),
      markdown: render_guide_markdown(guide_detail, public_base_url),
    };
  };

  const export_guide_html_zip = async (input: {
    auth: GuideAuthContext;
    project_id: string;
    guide_id: string;
  }): Promise<GuideHtmlZipExport> => {
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      guide_id: input.guide_id,
    };
    await ensure_project_exists({
      organization_id: scope.organization_id,
      project_id: scope.project_id,
    });

    const guide_detail = await repository.find_guide_detail(scope);

    if (!guide_detail) {
      throw new GuideNotFoundError();
    }

    if (!options.file_storage) {
      throw new GuideExportFileNotFoundError();
    }

    const rendered = render_guide_html_export(guide_detail);
    const capture_asset_ids = rendered.image_references.map((reference) => reference.capture_asset_id);
    const export_asset_files = capture_asset_ids.length > 0
      ? await repository.find_guide_export_asset_files({
        ...scope,
        capture_asset_ids,
      })
      : [];
    const export_files_by_asset_id = new Map(
      export_asset_files.map((file) => [file.capture_asset_id, file])
    );
    const images = await Promise.all(rendered.image_references.map(async (reference) => {
      const file = export_files_by_asset_id.get(reference.capture_asset_id);

      if (!file) {
        throw new GuideExportFileNotFoundError();
      }

      if (file.storage_provider !== "local") {
        throw new UnsupportedGuideExportStorageProviderError();
      }

      const stored_file = await options.file_storage!.get({
        storage_key: file.storage_key,
      }).catch(() => {
        throw new GuideExportFileNotFoundError();
      });

      return {
        path: reference.asset_path,
        stream: stored_file.stream,
      };
    }));
    const zip_export = await build_guide_zip_export({
      html: rendered.html,
      images,
    });

    return {
      filename: html_zip_filename(guide_detail.guide),
      ...zip_export,
    };
  };

  const update_guide = async (input: {
    auth: GuideAuthContext;
    project_id: string;
    guide_id: string;
    data: UpdateGuideInput;
  }) => {
    const data = normalize_update_guide_input(input.data);
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    };
    await ensure_project_exists(scope);

    const guide_detail = await repository.find_guide_detail({
      ...scope,
      guide_id: input.guide_id,
    });

    if (!guide_detail) {
      throw new GuideNotFoundError();
    }

    if (guide_detail.guide.status !== "draft") {
      throw new GuideNotEditableError();
    }

    if (data.status === guide_detail.guide.status) {
      throw new InvalidGuideInputError();
    }

    return repository.update_guide({
      ...scope,
      guide_id: input.guide_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      data,
    });
  };

  const ensure_editable_guide = async (input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
  }) => {
    const guide_detail = await repository.find_guide_detail(input);

    if (!guide_detail) {
      throw new GuideNotFoundError();
    }

    if (guide_detail.guide.status !== "draft") {
      throw new GuideNotEditableError();
    }

    return guide_detail.guide;
  };

  const update_guide_step = async (input: {
    auth: GuideAuthContext;
    project_id: string;
    guide_id: string;
    guide_step_id: string;
    data: UpdateGuideStepInput;
  }) => {
    const data = normalize_update_guide_step_input(input.data);
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      guide_id: input.guide_id,
    };
    await ensure_project_exists({
      organization_id: scope.organization_id,
      project_id: scope.project_id,
    });
    await ensure_editable_guide(scope);

    const guide_step = await repository.find_guide_step({
      ...scope,
      guide_step_id: input.guide_step_id,
    });

    if (!guide_step) {
      throw new GuideStepNotFoundError();
    }

    return repository.update_guide_step({
      ...scope,
      guide_step_id: input.guide_step_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      data,
    });
  };

  const reorder_guide_blocks = async (input: {
    auth: GuideAuthContext;
    project_id: string;
    guide_id: string;
    block_ids: string[];
  }) => {
    const block_ids = normalize_block_ids(input.block_ids);
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      guide_id: input.guide_id,
    };
    await ensure_project_exists({
      organization_id: scope.organization_id,
      project_id: scope.project_id,
    });
    await ensure_editable_guide(scope);

    const active_blocks = await repository.list_guide_blocks(scope);

    if (active_blocks.length === 0) {
      throw new InvalidGuideBlockOrderError();
    }

    const active_ids = new Set(active_blocks.map((block) => block.id));
    const includes_unknown_block = block_ids.some((id) => !active_ids.has(id));

    if (includes_unknown_block) {
      throw new GuideBlockNotFoundError();
    }

    const every_active_block_included = active_ids.size === block_ids.length
      && block_ids.every((id) => active_ids.has(id));

    if (!every_active_block_included) {
      throw new InvalidGuideBlockOrderError();
    }

    return repository.reorder_guide_blocks({
      ...scope,
      actor_org_user_id: input.auth.actor_org_user_id,
      block_ids,
    });
  };

  const create_guide_block = async (input: {
    auth: GuideAuthContext;
    project_id: string;
    guide_id: string;
    data: CreateGuideBlockInput;
  }) => {
    const data = normalize_create_guide_block_input(input.data);
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      guide_id: input.guide_id,
    };
    await ensure_project_exists({
      organization_id: scope.organization_id,
      project_id: scope.project_id,
    });
    await ensure_editable_guide(scope);

    if (data.position) {
      const active_blocks = await repository.list_guide_blocks(scope);
      const target_exists = active_blocks.some((block) => block.id === data.position?.guide_block_id);

      if (!target_exists) {
        throw new GuideBlockNotFoundError();
      }
    }

    return repository.create_guide_block({
      ...scope,
      actor_org_user_id: input.auth.actor_org_user_id,
      data,
    });
  };

  const update_guide_block = async (input: {
    auth: GuideAuthContext;
    project_id: string;
    guide_id: string;
    guide_block_id: string;
    data: UpdateGuideBlockInput;
  }) => {
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      guide_id: input.guide_id,
    };
    await ensure_project_exists({
      organization_id: scope.organization_id,
      project_id: scope.project_id,
    });
    await ensure_editable_guide(scope);

    const block = (await repository.list_guide_blocks(scope))
      .find((candidate) => candidate.id === input.guide_block_id);

    if (!block) {
      throw new GuideBlockNotFoundError();
    }

    const data = normalize_update_guide_block_input(block.block_type, input.data);

    return repository.update_guide_block({
      ...scope,
      guide_block_id: input.guide_block_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      data,
    });
  };

  const update_guide_block_screenshot = async (input: {
    auth: GuideAuthContext;
    project_id: string;
    guide_id: string;
    guide_block_id: string;
    data: UpdateGuideBlockScreenshotInput;
  }) => {
    const data = normalize_update_guide_block_screenshot_input(input.data);
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      guide_id: input.guide_id,
    };
    await ensure_project_exists({
      organization_id: scope.organization_id,
      project_id: scope.project_id,
    });
    await ensure_editable_guide(scope);

    const block = (await repository.list_guide_blocks(scope))
      .find((candidate) => candidate.id === input.guide_block_id);

    if (!block) {
      throw new GuideBlockNotFoundError();
    }

    if (block.block_type !== "step") {
      throw new InvalidGuideBlockScreenshotError();
    }

    if (
      data.selected_capture_asset_id
      && !await repository.active_screenshot_asset_exists({
        organization_id: scope.organization_id,
        project_id: scope.project_id,
        capture_asset_id: data.selected_capture_asset_id,
      })
    ) {
      throw new InvalidGuideBlockScreenshotError();
    }

    return repository.update_guide_block_screenshot({
      ...scope,
      guide_block_id: input.guide_block_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      data,
    });
  };

  const update_guide_block_annotations = async (input: {
    auth: GuideAuthContext;
    project_id: string;
    guide_id: string;
    guide_block_id: string;
    data: UpdateGuideBlockAnnotationsInput;
  }) => {
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      guide_id: input.guide_id,
    };
    await ensure_project_exists({
      organization_id: scope.organization_id,
      project_id: scope.project_id,
    });
    await ensure_editable_guide(scope);

    const block = (await repository.list_guide_blocks(scope))
      .find((candidate) => candidate.id === input.guide_block_id);

    if (!block) {
      throw new GuideBlockNotFoundError();
    }

    const data = normalize_update_guide_block_annotations_input(block, input.data);

    return repository.update_guide_block_annotations({
      ...scope,
      guide_block_id: input.guide_block_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      data,
    });
  };

  const prepare_guide_block_screenshot_upload = async (input: {
    auth: GuideAuthContext;
    project_id: string;
    guide_id: string;
    guide_block_id: string;
  }): Promise<PrepareGuideBlockScreenshotUploadResult> => {
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      guide_id: input.guide_id,
    };
    await ensure_project_exists({
      organization_id: scope.organization_id,
      project_id: scope.project_id,
    });
    const guide = await ensure_editable_guide(scope);

    const block = (await repository.list_guide_blocks(scope))
      .find((candidate) => candidate.id === input.guide_block_id);

    if (!block) {
      throw new GuideBlockNotFoundError();
    }

    if (block.block_type !== "step") {
      throw new InvalidGuideBlockScreenshotError();
    }

    const capture_session_id = compact_optional_string(
      block.source_capture_session_id ?? guide.source_capture_session_id
    );

    if (!capture_session_id) {
      throw new InvalidGuideBlockScreenshotError();
    }

    await ensure_capture_session_exists({
      organization_id: scope.organization_id,
      project_id: scope.project_id,
      capture_session_id,
    });

    return { capture_session_id };
  };

  const delete_guide_block = async (input: {
    auth: GuideAuthContext;
    project_id: string;
    guide_id: string;
    guide_block_id: string;
  }) => {
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      guide_id: input.guide_id,
    };
    await ensure_project_exists({
      organization_id: scope.organization_id,
      project_id: scope.project_id,
    });
    await ensure_editable_guide(scope);

    const deleted = await repository.delete_guide_block({
      ...scope,
      guide_block_id: input.guide_block_id,
      actor_org_user_id: input.auth.actor_org_user_id,
    });

    if (!deleted) {
      throw new GuideBlockNotFoundError();
    }
  };

  return {
    create_guide_from_capture,
    list_guides,
    get_guide_detail,
    export_guide_markdown,
    export_guide_html_zip,
    update_guide,
    update_guide_step,
    reorder_guide_blocks,
    create_guide_block,
    update_guide_block,
    update_guide_block_screenshot,
    update_guide_block_annotations,
    prepare_guide_block_screenshot_upload,
    delete_guide_block,
  };
};
