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

export type UpdateGuideInput = {
  title?: string;
  description?: string | null;
  status?: GuideStatus;
};

export type UpdateGuideStepInput = {
  title?: string;
  body?: string | null;
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
  delete_guide_block: (input: {
    organization_id: string;
    project_id: string;
    guide_id: string;
    guide_block_id: string;
    actor_org_user_id: string;
  }) => Promise<boolean>;
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
    update_guide,
    update_guide_step,
    reorder_guide_blocks,
    delete_guide_block,
  };
};
