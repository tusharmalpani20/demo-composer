export type CaptureEventAuthContext = {
  organization_id: string;
  actor_org_user_id: string;
};

export type CaptureEventType = "navigation" | "click" | "input" | "capture" | "note";
export type CaptureSessionSourceType = "manual" | "extension" | "import";
export type CaptureSessionStatus = "draft" | "capturing" | "completed" | "canceled" | "archived";

export type CaptureEvent = {
  id: string;
  organization_id: string;
  project_id: string;
  capture_session_id: string;
  capture_asset_id: string | null;
  event_type: CaptureEventType;
  event_index: number;
  occurred_at: string;
  page_url: string | null;
  page_title: string | null;
  target_label: string | null;
  target_selector: string | null;
  target_role: string | null;
  target_test_id: string | null;
  target_text: string | null;
  client_x: number | null;
  client_y: number | null;
  viewport_width: number | null;
  viewport_height: number | null;
  device_pixel_ratio: number | null;
  input_intent: string | null;
  input_value_redacted: true;
  note: string | null;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: string;
  updated_at: string;
};

export type CreateCaptureEventInput = {
  event_type: CaptureEventType;
  event_index: number;
  capture_asset_id?: string | null;
  occurred_at?: string | null;
  page_url?: string | null;
  page_title?: string | null;
  target_label?: string | null;
  target_selector?: string | null;
  target_role?: string | null;
  target_test_id?: string | null;
  target_text?: string | null;
  client_x?: number | null;
  client_y?: number | null;
  viewport_width?: number | null;
  viewport_height?: number | null;
  device_pixel_ratio?: number | null;
  input_intent?: string | null;
  input_value_redacted?: boolean;
  note?: string | null;
  metadata?: unknown;
} & Record<string, unknown>;

export type ReorderCaptureEventsInput = {
  event_ids: string[];
};

export type UpdateCaptureEventInput = {
  page_url?: string | null;
  page_title?: string | null;
  target_label?: string | null;
  target_text?: string | null;
  input_intent?: string | null;
  note?: string | null;
} & Record<string, unknown>;

export type NormalizedCreateCaptureEventInput = {
  event_type: CaptureEventType;
  event_index: number;
  capture_asset_id?: string | null;
  occurred_at?: string | null;
  page_url?: string | null;
  page_title?: string | null;
  target_label?: string | null;
  target_selector?: string | null;
  target_role?: string | null;
  target_test_id?: string | null;
  target_text?: string | null;
  client_x?: number | null;
  client_y?: number | null;
  viewport_width?: number | null;
  viewport_height?: number | null;
  device_pixel_ratio?: number | null;
  input_intent?: string | null;
  input_value_redacted: true;
  note?: string | null;
  metadata?: unknown;
};

export type NormalizedUpdateCaptureEventInput = {
  page_url?: string | null;
  page_title?: string | null;
  target_label?: string | null;
  target_text?: string | null;
  input_intent?: string | null;
  note?: string | null;
};

export type CaptureEventRepository = {
  project_exists: (input: {
    organization_id: string;
    project_id: string;
  }) => Promise<boolean>;
  capture_session_exists: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
  }) => Promise<boolean>;
  get_capture_session_source_type: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
  }) => Promise<CaptureSessionSourceType | null>;
  get_capture_session_editability: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
  }) => Promise<{
    source_type: CaptureSessionSourceType;
    status: CaptureSessionStatus;
  } | null>;
  capture_asset_exists: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    capture_asset_id: string;
  }) => Promise<boolean>;
  create_capture_event: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    actor_org_user_id: string;
    data: NormalizedCreateCaptureEventInput;
  }) => Promise<CaptureEvent>;
  list_capture_events: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    event_type?: CaptureEventType;
  }) => Promise<CaptureEvent[]>;
  find_capture_event: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    capture_event_id: string;
  }) => Promise<CaptureEvent | null>;
  delete_capture_event: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    capture_event_id: string;
    actor_org_user_id: string;
  }) => Promise<boolean>;
  reorder_capture_events: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    actor_org_user_id: string;
    event_ids: string[];
  }) => Promise<CaptureEvent[]>;
  update_capture_event: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    capture_event_id: string;
    actor_org_user_id: string;
    data: NormalizedUpdateCaptureEventInput;
  }) => Promise<CaptureEvent | null>;
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

export class CaptureAssetNotFoundError extends Error {
  constructor() {
    super("Capture asset was not found");
  }
}

export class CaptureEventNotFoundError extends Error {
  constructor() {
    super("Capture event was not found");
  }
}

export class InvalidCaptureEventInputError extends Error {
  constructor() {
    super("Capture event input is invalid");
  }
}

export class CaptureEventIndexConflictError extends Error {
  constructor() {
    super("A capture event with this index already exists");
  }
}

export class InvalidCaptureEventOrderError extends Error {
  constructor() {
    super("Capture event order is invalid");
  }
}

export class CaptureEventReorderNotAllowedError extends Error {
  constructor() {
    super("Only manual capture sessions can be reordered");
  }
}

export class CaptureEventUpdateNotAllowedError extends Error {
  constructor() {
    super("Only active manual capture sessions can be edited");
  }
}

const raw_input_field_names = new Set([
  "input_value",
  "value",
  "typed_value",
  "password",
  "secret",
]);

const compact_optional_string = (value: string | null | undefined) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
};

const has_raw_input_field = (input: CreateCaptureEventInput) => (
  Object.keys(input).some((key) => raw_input_field_names.has(key))
);

const editable_update_field_names = new Set([
  "page_url",
  "page_title",
  "target_label",
  "target_text",
  "input_intent",
  "note",
]);

const has_forbidden_update_field = (input: UpdateCaptureEventInput) => (
  Object.keys(input).some((key) => (
    raw_input_field_names.has(key)
    || !editable_update_field_names.has(key)
  ))
);

const has_click_target = (input: NormalizedCreateCaptureEventInput) => (
  Boolean(input.target_label)
  || Boolean(input.target_selector)
  || Boolean(input.target_role)
  || Boolean(input.target_text)
  || input.client_x !== undefined
  || input.client_y !== undefined
);

const normalize_create_capture_event = (
  input: CreateCaptureEventInput
): NormalizedCreateCaptureEventInput => {
  if (has_raw_input_field(input) || input.input_value_redacted === false) {
    throw new InvalidCaptureEventInputError();
  }

  const normalized: NormalizedCreateCaptureEventInput = {
    event_type: input.event_type,
    event_index: input.event_index,
    capture_asset_id: compact_optional_string(input.capture_asset_id),
    occurred_at: compact_optional_string(input.occurred_at),
    page_url: compact_optional_string(input.page_url),
    page_title: compact_optional_string(input.page_title),
    target_label: compact_optional_string(input.target_label),
    target_selector: compact_optional_string(input.target_selector),
    target_role: compact_optional_string(input.target_role),
    target_test_id: compact_optional_string(input.target_test_id),
    target_text: compact_optional_string(input.target_text),
    client_x: input.client_x,
    client_y: input.client_y,
    viewport_width: input.viewport_width,
    viewport_height: input.viewport_height,
    device_pixel_ratio: input.device_pixel_ratio,
    input_intent: compact_optional_string(input.input_intent),
    input_value_redacted: true,
    note: compact_optional_string(input.note),
    metadata: input.metadata,
  };

  if (normalized.event_type === "navigation" && !normalized.page_url) {
    throw new InvalidCaptureEventInputError();
  }
  if (normalized.event_type === "click" && !has_click_target(normalized)) {
    throw new InvalidCaptureEventInputError();
  }
  if (normalized.event_type === "capture" && !normalized.capture_asset_id) {
    throw new InvalidCaptureEventInputError();
  }
  if (normalized.event_type === "note" && !normalized.note) {
    throw new InvalidCaptureEventInputError();
  }

  return normalized;
};

const normalize_reorder_capture_events = (
  input: ReorderCaptureEventsInput
) => {
  if (!Array.isArray(input.event_ids) || input.event_ids.length === 0) {
    throw new InvalidCaptureEventOrderError();
  }

  const event_ids = input.event_ids.map((id) => id.trim());

  if (event_ids.some((id) => id.length === 0)) {
    throw new InvalidCaptureEventOrderError();
  }

  if (new Set(event_ids).size !== event_ids.length) {
    throw new InvalidCaptureEventOrderError();
  }

  return event_ids;
};

const normalize_update_capture_event = (
  input: UpdateCaptureEventInput
): NormalizedUpdateCaptureEventInput => {
  const keys = Object.keys(input);

  if (keys.length === 0 || has_forbidden_update_field(input)) {
    throw new InvalidCaptureEventInputError();
  }

  const normalized: NormalizedUpdateCaptureEventInput = {};

  for (const key of editable_update_field_names) {
    if (input[key] !== undefined) {
      normalized[key as keyof NormalizedUpdateCaptureEventInput] =
        compact_optional_string(input[key] as string | null | undefined);
    }
  }

  return normalized;
};

export const build_capture_event_service = (repository: CaptureEventRepository) => {
  const ensure_project_exists = async (input: {
    organization_id: string;
    project_id: string;
  }) => {
    const exists = await repository.project_exists(input);

    if (!exists) {
      throw new ProjectNotFoundError();
    }
  };

  const ensure_capture_session_exists = async (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
  }) => {
    const exists = await repository.capture_session_exists(input);

    if (!exists) {
      throw new CaptureSessionNotFoundError();
    }
  };

  const ensure_scope_exists = async (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
  }) => {
    await ensure_project_exists({
      organization_id: input.organization_id,
      project_id: input.project_id,
    });
    await ensure_capture_session_exists(input);
  };

  const ensure_capture_asset_exists = async (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    capture_asset_id?: string | null;
  }) => {
    if (!input.capture_asset_id) {
      return;
    }

    const exists = await repository.capture_asset_exists({
      organization_id: input.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
      capture_asset_id: input.capture_asset_id,
    });

    if (!exists) {
      throw new CaptureAssetNotFoundError();
    }
  };

  const create_capture_event = async (input: {
    auth: CaptureEventAuthContext;
    project_id: string;
    capture_session_id: string;
    data: CreateCaptureEventInput;
  }) => {
    const data = normalize_create_capture_event(input.data);
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
    };

    await ensure_scope_exists(scope);
    await ensure_capture_asset_exists({
      ...scope,
      capture_asset_id: data.capture_asset_id,
    });

    return repository.create_capture_event({
      ...scope,
      actor_org_user_id: input.auth.actor_org_user_id,
      data,
    });
  };

  const list_capture_events = async (input: {
    auth: CaptureEventAuthContext;
    project_id: string;
    capture_session_id: string;
    event_type?: CaptureEventType;
  }) => {
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
    };
    await ensure_scope_exists(scope);

    return repository.list_capture_events({
      ...scope,
      event_type: input.event_type,
    });
  };

  const get_capture_event = async (input: {
    auth: CaptureEventAuthContext;
    project_id: string;
    capture_session_id: string;
    capture_event_id: string;
  }) => {
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
    };
    await ensure_scope_exists(scope);

    const capture_event = await repository.find_capture_event({
      ...scope,
      capture_event_id: input.capture_event_id,
    });

    if (!capture_event) {
      throw new CaptureEventNotFoundError();
    }

    return capture_event;
  };

  const delete_capture_event = async (input: {
    auth: CaptureEventAuthContext;
    project_id: string;
    capture_session_id: string;
    capture_event_id: string;
  }) => {
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
    };
    await ensure_scope_exists(scope);

    const deleted = await repository.delete_capture_event({
      ...scope,
      capture_event_id: input.capture_event_id,
      actor_org_user_id: input.auth.actor_org_user_id,
    });

    if (!deleted) {
      throw new CaptureEventNotFoundError();
    }
  };

  const reorder_capture_events = async (input: {
    auth: CaptureEventAuthContext;
    project_id: string;
    capture_session_id: string;
    data: ReorderCaptureEventsInput;
  }) => {
    const event_ids = normalize_reorder_capture_events(input.data);
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
    };

    await ensure_project_exists({
      organization_id: scope.organization_id,
      project_id: scope.project_id,
    });

    const source_type = await repository.get_capture_session_source_type(scope);

    if (!source_type) {
      throw new CaptureSessionNotFoundError();
    }

    if (source_type !== "manual") {
      throw new CaptureEventReorderNotAllowedError();
    }

    const active_events = await repository.list_capture_events(scope);
    const active_ids = new Set(active_events.map((event) => event.id));

    if (active_events.length !== event_ids.length) {
      throw new InvalidCaptureEventOrderError();
    }

    if (event_ids.some((event_id) => !active_ids.has(event_id))) {
      throw new InvalidCaptureEventOrderError();
    }

    return repository.reorder_capture_events({
      ...scope,
      actor_org_user_id: input.auth.actor_org_user_id,
      event_ids,
    });
  };

  const update_capture_event = async (input: {
    auth: CaptureEventAuthContext;
    project_id: string;
    capture_session_id: string;
    capture_event_id: string;
    data: UpdateCaptureEventInput;
  }) => {
    const data = normalize_update_capture_event(input.data);
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
    };

    await ensure_project_exists({
      organization_id: scope.organization_id,
      project_id: scope.project_id,
    });

    const editability = await repository.get_capture_session_editability(scope);

    if (!editability) {
      throw new CaptureSessionNotFoundError();
    }

    if (
      editability.source_type !== "manual"
      || editability.status === "archived"
      || editability.status === "canceled"
    ) {
      throw new CaptureEventUpdateNotAllowedError();
    }

    const capture_event = await repository.update_capture_event({
      ...scope,
      capture_event_id: input.capture_event_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      data,
    });

    if (!capture_event) {
      throw new CaptureEventNotFoundError();
    }

    return capture_event;
  };

  return {
    create_capture_event,
    list_capture_events,
    get_capture_event,
    delete_capture_event,
    reorder_capture_events,
    update_capture_event,
  };
};
