export type InteractiveDemoAuthContext = {
  organization_id: string;
  actor_org_user_id: string;
};

export type InteractiveDemoStatus = "draft" | "archived";

export type InteractiveDemo = {
  id: string;
  organization_id: string;
  project_id: string;
  source_capture_session_id: string | null;
  title: string;
  description: string | null;
  status: InteractiveDemoStatus;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: string;
  updated_at: string;
};

export type DemoScene = {
  id: string;
  organization_id: string;
  project_id: string;
  interactive_demo_id: string;
  source_capture_session_id: string | null;
  source_capture_event_id: string | null;
  source_capture_asset_id: string | null;
  scene_index: number;
  title: string | null;
  description: string | null;
  background_capture_asset_id: string | null;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: string;
  updated_at: string;
};

export type InteractiveDemoSourceEventType = "navigation" | "click" | "input" | "capture" | "note";

export type InteractiveDemoSourceEvent = {
  id: string;
  event_type: InteractiveDemoSourceEventType;
  event_index: number;
  capture_asset_id: string | null;
  page_title: string | null;
  target_label: string | null;
  target_text: string | null;
  note: string | null;
};

export type InteractiveDemoSourceCaptureSession = {
  id: string;
  name: string;
  description: string | null;
};

export type CreateInteractiveDemoInput = {
  title: string;
  description?: string | null;
  source_capture_session_id?: string | null;
};

export type CreateInteractiveDemoFromCaptureInput = {
  title?: string;
  description?: string | null;
};

export type UpdateInteractiveDemoInput = Partial<{
  title: string;
  description: string | null;
  status: InteractiveDemoStatus;
}>;

export type CreateDemoSceneInput = {
  title?: string | null;
  description?: string | null;
  background_capture_asset_id?: string | null;
  source_capture_session_id?: string | null;
  source_capture_event_id?: string | null;
  source_capture_asset_id?: string | null;
};

export type UpdateDemoSceneInput = Partial<{
  title: string | null;
  description: string | null;
  background_capture_asset_id: string | null;
}>;

export type NormalizedCreateInteractiveDemoInput = {
  title: string;
  description: string | null;
  source_capture_session_id: string | null;
};

export type NormalizedUpdateInteractiveDemoInput = Partial<{
  title: string;
  description: string | null;
  status: InteractiveDemoStatus;
}>;

export type NormalizedCreateDemoSceneInput = {
  title: string | null;
  description: string | null;
  background_capture_asset_id: string | null;
  source_capture_session_id: string | null;
  source_capture_event_id: string | null;
  source_capture_asset_id: string | null;
};

export type NormalizedCreateInteractiveDemoFromCaptureInput = {
  title: string;
  description: string | null;
  scenes: Array<{
    scene_index: number;
    source_capture_event_id: string;
    source_capture_asset_id: string;
    background_capture_asset_id: string;
    title: string;
    description: string | null;
  }>;
};

export type NormalizedUpdateDemoSceneInput = Partial<{
  title: string | null;
  description: string | null;
  background_capture_asset_id: string | null;
}>;

export type InteractiveDemoRepository = {
  project_exists: (input: {
    organization_id: string;
    project_id: string;
  }) => Promise<boolean>;
  create_demo: (input: {
    organization_id: string;
    project_id: string;
    actor_org_user_id: string;
    data: NormalizedCreateInteractiveDemoInput;
  }) => Promise<InteractiveDemo>;
  list_demos: (input: {
    organization_id: string;
    project_id: string;
  }) => Promise<InteractiveDemo[]>;
  find_demo: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
  }) => Promise<InteractiveDemo | null>;
  update_demo: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    actor_org_user_id: string;
    data: NormalizedUpdateInteractiveDemoInput;
  }) => Promise<InteractiveDemo | null>;
  delete_demo: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    actor_org_user_id: string;
  }) => Promise<boolean>;
  background_asset_exists: (input: {
    organization_id: string;
    project_id: string;
    capture_asset_id: string;
  }) => Promise<boolean>;
  find_capture_session_for_demo: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
  }) => Promise<InteractiveDemoSourceCaptureSession | null>;
  list_capture_events_for_demo: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
  }) => Promise<InteractiveDemoSourceEvent[]>;
  list_screenshot_capture_asset_ids: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    capture_asset_ids: string[];
  }) => Promise<string[]>;
  create_demo_from_capture: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    actor_org_user_id: string;
    data: NormalizedCreateInteractiveDemoFromCaptureInput;
  }) => Promise<{
    interactive_demo: InteractiveDemo;
    demo_scenes: DemoScene[];
  }>;
  create_scene: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    actor_org_user_id: string;
    data: NormalizedCreateDemoSceneInput;
  }) => Promise<DemoScene>;
  list_scenes: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
  }) => Promise<DemoScene[]>;
  update_scene: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    demo_scene_id: string;
    actor_org_user_id: string;
    data: NormalizedUpdateDemoSceneInput;
  }) => Promise<DemoScene | null>;
  reorder_scenes: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    actor_org_user_id: string;
    scene_ids: string[];
  }) => Promise<DemoScene[]>;
  delete_scene: (input: {
    organization_id: string;
    project_id: string;
    interactive_demo_id: string;
    demo_scene_id: string;
    actor_org_user_id: string;
  }) => Promise<boolean>;
};

export class ProjectNotFoundError extends Error {
  constructor() {
    super("Project was not found");
  }
}

export class InteractiveDemoNotFoundError extends Error {
  constructor() {
    super("Interactive demo was not found");
  }
}

export class CaptureSessionNotFoundError extends Error {
  constructor() {
    super("Capture session was not found");
  }
}

export class NoUsableCaptureEventsError extends Error {
  constructor() {
    super("Capture session has no screenshot-backed events");
  }
}

export class DemoSceneNotFoundError extends Error {
  constructor() {
    super("Demo scene was not found");
  }
}

export class EmptyInteractiveDemoUpdateError extends Error {
  constructor() {
    super("At least one interactive demo field must be provided");
  }
}

export class EmptyDemoSceneUpdateError extends Error {
  constructor() {
    super("At least one demo scene field must be provided");
  }
}

export class EmptyDemoSceneOrderError extends Error {
  constructor() {
    super("At least one demo scene id must be provided");
  }
}

export class InvalidDemoSceneOrderError extends Error {
  constructor() {
    super("Demo scene order is invalid");
  }
}

export class InvalidDemoSceneReferenceError extends Error {
  constructor() {
    super("Demo scene references are invalid");
  }
}

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

const normalize_create_demo = (
  input: CreateInteractiveDemoInput
): NormalizedCreateInteractiveDemoInput => ({
  title: input.title.trim(),
  description: compact_optional_string(input.description) ?? null,
  source_capture_session_id: compact_optional_string(input.source_capture_session_id) ?? null,
});

const normalize_create_demo_from_capture = (
  capture_session: InteractiveDemoSourceCaptureSession
): Omit<NormalizedCreateInteractiveDemoFromCaptureInput, "scenes"> => ({
  title: capture_session.name.trim(),
  description: compact_optional_string(capture_session.description) ?? null,
});

const normalize_update_demo = (
  input: UpdateInteractiveDemoInput
): NormalizedUpdateInteractiveDemoInput => {
  const normalized: NormalizedUpdateInteractiveDemoInput = {};

  if (input.title !== undefined) {
    normalized.title = input.title.trim();
  }
  if (input.description !== undefined) {
    normalized.description = compact_optional_string(input.description) ?? null;
  }
  if (input.status !== undefined) {
    normalized.status = input.status;
  }

  return normalized;
};

const normalize_create_scene = (
  input: CreateDemoSceneInput
): NormalizedCreateDemoSceneInput => ({
  title: compact_optional_string(input.title) ?? null,
  description: compact_optional_string(input.description) ?? null,
  background_capture_asset_id: compact_optional_string(input.background_capture_asset_id) ?? null,
  source_capture_session_id: compact_optional_string(input.source_capture_session_id) ?? null,
  source_capture_event_id: compact_optional_string(input.source_capture_event_id) ?? null,
  source_capture_asset_id: compact_optional_string(input.source_capture_asset_id) ?? null,
});

const normalize_update_scene = (
  input: UpdateDemoSceneInput
): NormalizedUpdateDemoSceneInput => {
  const normalized: NormalizedUpdateDemoSceneInput = {};

  if (input.title !== undefined) {
    normalized.title = compact_optional_string(input.title) ?? null;
  }
  if (input.description !== undefined) {
    normalized.description = compact_optional_string(input.description) ?? null;
  }
  if (input.background_capture_asset_id !== undefined) {
    normalized.background_capture_asset_id = compact_optional_string(input.background_capture_asset_id) ?? null;
  }

  return normalized;
};

const ensure_project = async (
  repository: InteractiveDemoRepository,
  input: {
    organization_id: string;
    project_id: string;
  }
) => {
  const exists = await repository.project_exists(input);

  if (!exists) {
    throw new ProjectNotFoundError();
  }
};

const ensure_background_asset = async (
  repository: InteractiveDemoRepository,
  input: {
    organization_id: string;
    project_id: string;
    capture_asset_id: string | null | undefined;
  }
) => {
  if (!input.capture_asset_id) {
    return;
  }

  const exists = await repository.background_asset_exists({
    organization_id: input.organization_id,
    project_id: input.project_id,
    capture_asset_id: input.capture_asset_id,
  });

  if (!exists) {
    throw new InvalidDemoSceneReferenceError();
  }
};

const assert_unique_scene_ids = (scene_ids: string[]) => {
  if (scene_ids.length === 0) {
    throw new EmptyDemoSceneOrderError();
  }

  if (new Set(scene_ids).size !== scene_ids.length) {
    throw new InvalidDemoSceneOrderError();
  }
};

const scene_title_from_event = (event: InteractiveDemoSourceEvent) => {
  const target_text = compact_optional_string(event.target_text);
  if (event.event_type === "click" && target_text) {
    return `Click ${target_text}`;
  }

  const target_label = compact_optional_string(event.target_label);
  if (event.event_type === "click" && target_label) {
    return `Click ${target_label}`;
  }

  const page_title = compact_optional_string(event.page_title);
  if (page_title) {
    return page_title;
  }

  const note = compact_optional_string(event.note);
  if (note) {
    return note;
  }

  return `Step ${event.event_index}`;
};

const demo_redirect_path = (project_id: string, interactive_demo_id: string) => (
  `/projects/${encodeURIComponent(project_id)}/interactive-demos/${encodeURIComponent(interactive_demo_id)}`
);

export const build_interactive_demo_service = (repository: InteractiveDemoRepository) => {
  const create_interactive_demo_from_capture = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    capture_session_id: string;
    data: CreateInteractiveDemoFromCaptureInput;
  }) => {
    const scope = {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
    };

    await ensure_project(repository, {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    });

    const capture_session = await repository.find_capture_session_for_demo(scope);
    if (!capture_session) {
      throw new CaptureSessionNotFoundError();
    }
    const normalized = normalize_create_demo_from_capture(capture_session);

    const source_events = await repository.list_capture_events_for_demo(scope);
    const capture_asset_ids = [
      ...new Set(source_events.map((event) => event.capture_asset_id).filter((id): id is string => Boolean(id))),
    ];
    const screenshot_capture_asset_ids = new Set(
      await repository.list_screenshot_capture_asset_ids({
        ...scope,
        capture_asset_ids,
      })
    );
    const scenes = source_events
      .filter((event) => event.capture_asset_id && screenshot_capture_asset_ids.has(event.capture_asset_id))
      .map((event, index) => ({
        scene_index: index + 1,
        source_capture_event_id: event.id,
        source_capture_asset_id: event.capture_asset_id as string,
        background_capture_asset_id: event.capture_asset_id as string,
        title: scene_title_from_event(event),
        description: null,
      }));

    if (scenes.length === 0) {
      throw new NoUsableCaptureEventsError();
    }

    const result = await repository.create_demo_from_capture({
      ...scope,
      actor_org_user_id: input.auth.actor_org_user_id,
      data: {
        ...normalized,
        scenes,
      },
    });

    return {
      ...result,
      redirect_path: demo_redirect_path(input.project_id, result.interactive_demo.id),
    };
  };

  const create_interactive_demo = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    data: CreateInteractiveDemoInput;
  }) => {
    await ensure_project(repository, {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    });

    return repository.create_demo({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      data: normalize_create_demo(input.data),
    });
  };

  const list_interactive_demos = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
  }) => {
    await ensure_project(repository, {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    });

    return repository.list_demos({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    });
  };

  const get_interactive_demo = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    interactive_demo_id: string;
  }) => {
    const demo = await repository.find_demo({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
    });

    if (!demo) {
      throw new InteractiveDemoNotFoundError();
    }

    return demo;
  };

  const update_interactive_demo = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    interactive_demo_id: string;
    data: UpdateInteractiveDemoInput;
  }) => {
    const data = normalize_update_demo(input.data);

    if (Object.keys(data).length === 0) {
      throw new EmptyInteractiveDemoUpdateError();
    }

    const demo = await repository.update_demo({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      data,
    });

    if (!demo) {
      throw new InteractiveDemoNotFoundError();
    }

    return demo;
  };

  const delete_interactive_demo = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    interactive_demo_id: string;
  }) => {
    const deleted = await repository.delete_demo({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      actor_org_user_id: input.auth.actor_org_user_id,
    });

    if (!deleted) {
      throw new InteractiveDemoNotFoundError();
    }
  };

  const create_demo_scene = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    interactive_demo_id: string;
    data: CreateDemoSceneInput;
  }) => {
    await get_interactive_demo(input);
    const data = normalize_create_scene(input.data);
    await ensure_background_asset(repository, {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_asset_id: data.background_capture_asset_id,
    });

    return repository.create_scene({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      data,
    });
  };

  const list_demo_scenes = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    interactive_demo_id: string;
  }) => {
    await get_interactive_demo(input);
    return repository.list_scenes({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
    });
  };

  const update_demo_scene = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    interactive_demo_id: string;
    demo_scene_id: string;
    data: UpdateDemoSceneInput;
  }) => {
    await get_interactive_demo(input);
    const data = normalize_update_scene(input.data);

    if (Object.keys(data).length === 0) {
      throw new EmptyDemoSceneUpdateError();
    }

    await ensure_background_asset(repository, {
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_asset_id: data.background_capture_asset_id,
    });

    const scene = await repository.update_scene({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      demo_scene_id: input.demo_scene_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      data,
    });

    if (!scene) {
      throw new DemoSceneNotFoundError();
    }

    return scene;
  };

  const reorder_demo_scenes = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    interactive_demo_id: string;
    scene_ids: string[];
  }) => {
    await get_interactive_demo(input);
    assert_unique_scene_ids(input.scene_ids);

    const scenes = await repository.reorder_scenes({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      actor_org_user_id: input.auth.actor_org_user_id,
      scene_ids: input.scene_ids,
    });

    if (scenes.length !== input.scene_ids.length) {
      throw new InvalidDemoSceneOrderError();
    }

    return scenes;
  };

  const delete_demo_scene = async (input: {
    auth: InteractiveDemoAuthContext;
    project_id: string;
    interactive_demo_id: string;
    demo_scene_id: string;
  }) => {
    await get_interactive_demo(input);
    const deleted = await repository.delete_scene({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      interactive_demo_id: input.interactive_demo_id,
      demo_scene_id: input.demo_scene_id,
      actor_org_user_id: input.auth.actor_org_user_id,
    });

    if (!deleted) {
      throw new DemoSceneNotFoundError();
    }
  };

  return {
    create_interactive_demo_from_capture,
    create_interactive_demo,
    list_interactive_demos,
    get_interactive_demo,
    update_interactive_demo,
    delete_interactive_demo,
    create_demo_scene,
    list_demo_scenes,
    update_demo_scene,
    reorder_demo_scenes,
    delete_demo_scene,
  };
};
