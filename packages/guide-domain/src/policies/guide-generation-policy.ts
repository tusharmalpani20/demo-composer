import type { CreateGuideFromCaptureInput } from "@repo/types/guide";
import { InvalidGuideInputError } from "../errors/guide-domain-error";
import type {
  GuideSourceEvent,
  NormalizedCreateGuideFromCaptureInput,
} from "../types/guide-domain";

export { InvalidGuideInputError };

export const compact_optional_string = (value: string | null | undefined) => {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed || null;
};

export const cap_guide_title = (value: string) => (
  value.length > 180 ? value.slice(0, 180) : value
);

export const first_present = (...values: Array<string | null | undefined>) => {
  for (const value of values) {
    const compacted = compact_optional_string(value);

    if (compacted) {
      return compacted;
    }
  }

  return null;
};

const quoted = (value: string) => `"${value}"`;

const generate_capture_step_title = (event: GuideSourceEvent) => {
  const title_source = first_present(event.page_title, event.page_url);

  if (!title_source) {
    return "Capture this screen";
  }

  return cap_guide_title(`Capture ${quoted(title_source)}`);
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

export const generate_guide_step_from_source_event = (event: GuideSourceEvent) => {
  const target = first_present(
    event.target_label,
    event.target_text,
    event.target_role,
    event.page_title
  );

  switch (event.event_type) {
    case "note":
      return {
        title: cap_guide_title(first_present(event.note) ?? "Review this note"),
        body: null,
      };
    case "click":
      return {
        title: cap_guide_title(`Click ${quoted(target ?? "the highlighted element")}`),
        body: null,
      };
    case "input":
      return {
        title: cap_guide_title(`Enter the required value in ${quoted(target ?? "the field")}`),
        body: null,
      };
    case "navigation":
      return {
        title: cap_guide_title(`Navigate to ${quoted(first_present(event.page_title, event.page_url) ?? "the page")}`),
        body: null,
      };
    case "capture":
      return {
        title: generate_capture_step_title(event),
        body: generate_capture_step_body(event),
      };
  }
};

export const normalize_create_guide_from_capture_input = (
  input: CreateGuideFromCaptureInput
) => {
  const title = compact_optional_string(input.title);

  if (!title) {
    throw new InvalidGuideInputError();
  }

  const selected_capture_event_ids = input.selected_capture_event_ids
    ?.map((id) => id.trim())
    .filter(Boolean);

  if (
    selected_capture_event_ids
    && new Set(selected_capture_event_ids).size !== selected_capture_event_ids.length
  ) {
    throw new InvalidGuideInputError();
  }

  return {
    title: cap_guide_title(title),
    description: compact_optional_string(input.description),
    selected_capture_event_ids,
  };
};

export const build_guide_from_capture_source = (input: {
  title: string;
  description?: string | null;
  source_events: GuideSourceEvent[];
  active_capture_asset_ids: ReadonlySet<string>;
}): NormalizedCreateGuideFromCaptureInput => {
  const normalized = normalize_create_guide_from_capture_input(input);

  return {
    title: normalized.title,
    description: normalized.description,
    blocks: input.source_events.map((event, index) => ({
      block_type: "step",
      block_index: index + 1,
      source_capture_event_id: event.id,
      source_capture_asset_id: event.capture_asset_id && input.active_capture_asset_ids.has(event.capture_asset_id)
        ? event.capture_asset_id
        : null,
      step: generate_guide_step_from_source_event(event),
    })),
  };
};
