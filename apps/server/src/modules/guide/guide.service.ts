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
  block_type: GuideBlockType;
  block_index: number;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: string;
  updated_at: string;
  step: GuideStep | null;
};

export type GuideDetail = {
  guide: Guide;
  guide_blocks: GuideBlock[];
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

export class InvalidGuideInputError extends Error {
  constructor() {
    super("Guide input is invalid");
  }
}

const compact_optional_string = (value: string | null | undefined) => {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
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

const quoted = (value: string) => `"${value}"`;

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
      return "Review this screen";
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

export const build_guide_service = (repository: GuideRepository) => {
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
            body: null,
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

  return {
    create_guide_from_capture,
    list_guides,
    get_guide_detail,
  };
};
