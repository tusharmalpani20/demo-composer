import type {
  CaptureSession,
  CaptureSessionDetail,
  CaptureSessionStatus,
  CreateCaptureEventInput,
  CreateCaptureEventResponse,
  CreateCaptureSessionInput,
  ReorderCaptureEventsInput,
  ReorderCaptureEventsResponse,
  UpdateCaptureEventInput,
  UpdateCaptureEventResponse,
  UploadCaptureAssetInput,
  UploadCaptureAssetResponse,
} from "../features/capture-session/types";
import type { AuthResponse } from "../features/auth/types";
import type {
  Guide,
  GuideBlock,
  CreateGuideBlockInput,
  GuideDetail,
  GuideMarkdownExport,
  GuidePublishResult,
  GuidePublishStatusResponse,
  GuideRevokePublishResult,
  ProjectScreenshotAssetListResponse,
  GuideStep,
  PublicPublishLinkResponse,
  UpdateGuideBlockInput,
  UpdateGuideBlockAnnotationsInput,
  UpdateGuideBlockScreenshotInput,
  UpdateGuidePublishAccessInput,
  UpdateGuidePublishPasswordInput,
  UploadGuideBlockScreenshotInput,
  UploadGuideBlockScreenshotResponse,
} from "../features/guide/types";
import type {
  CreateDemoHotspotInput,
  DemoScene,
  DemoHotspot,
  InteractiveDemo,
  CreateInteractiveDemoFromCaptureResponse,
  UpdateDemoHotspotInput,
  UpdateDemoSceneInput,
  UpdateInteractiveDemoInput,
} from "../features/interactive-demo/types";
import type { CreateProjectInput, Project, ProjectStatus, UpdateProjectInput } from "../features/project/types";

export type ApiClientErrorKind = "unauthenticated" | "not_found" | "validation" | "unknown";

type ApiErrorBody = {
  error?: {
    type?: string;
    message?: string;
  };
};

export type ProjectGuideListResponse = {
  guides: Guide[];
};

export type PublicInstanceStatus = {
  deployment_mode: "self_hosted" | "hosted";
  onboarding_mode: "first_run_setup" | "signup";
  setup_required: boolean;
  signup_enabled: boolean;
};

export type ProjectDetailResponse = {
  project: Project;
};

export type ProjectListResponse = {
  projects: Project[];
};

export type ProjectCreateResponse = {
  project: Project;
};

export type ProjectUpdateResponse = {
  project: Project;
};

export type ProjectCaptureSessionListResponse = {
  capture_sessions: CaptureSession[];
};

export type ProjectInteractiveDemoListResponse = {
  interactive_demos: InteractiveDemo[];
};

export type InteractiveDemoDetailResponse = {
  interactive_demo: InteractiveDemo;
};

export type InteractiveDemoSceneListResponse = {
  demo_scenes: DemoScene[];
};

export type InteractiveDemoSceneUpdateResponse = {
  demo_scene: DemoScene;
};

export type InteractiveDemoSceneReorderResponse = {
  demo_scenes: DemoScene[];
};

export type InteractiveDemoHotspotListResponse = {
  demo_hotspots: DemoHotspot[];
};

export type InteractiveDemoHotspotCreateResponse = {
  demo_hotspot: DemoHotspot;
};

export type InteractiveDemoHotspotUpdateResponse = {
  demo_hotspot: DemoHotspot;
};

export type InteractiveDemoHotspotReorderResponse = {
  demo_hotspots: DemoHotspot[];
};

export type CaptureSessionCreateResponse = {
  capture_session: CaptureSession;
};

export type ListProjectsOptions = {
  status?: ProjectStatus;
};

export type ListCaptureSessionsOptions = {
  status?: CaptureSessionStatus;
};

export class ApiClientError extends Error {
  kind: ApiClientErrorKind;
  status: number;
  type: string | null;

  constructor(input: { kind: ApiClientErrorKind; status: number; message: string; type?: string | null }) {
    super(input.message);
    this.name = "ApiClientError";
    this.kind = input.kind;
    this.status = input.status;
    this.type = input.type ?? null;
  }
}

const apiBaseUrl = () => import.meta.env.VITE_DEMO_COMPOSER_API_URL ?? "";

const joinUrl = (baseUrl: string, path: string) => {
  if (!baseUrl) {
    return path;
  }

  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

const errorKind = (status: number, type?: string): ApiClientErrorKind => {
  if (status === 401 || type === "unauthenticated") {
    return "unauthenticated";
  }

  if (status === 404 || type?.endsWith("_not_found")) {
    return "not_found";
  }

  if (status === 400 || status === 409) {
    return "validation";
  }

  return "unknown";
};

const parseErrorBody = async (response: Response): Promise<ApiErrorBody> => {
  try {
    return await response.json() as ApiErrorBody;
  } catch {
    return {};
  }
};

const requestJson = async <Result>(
  path: string,
  init: RequestInit = {}
): Promise<Result> => {
  const response = await fetch(
    joinUrl(apiBaseUrl(), path),
    {
      ...init,
      credentials: "include",
      headers: {
        accept: "application/json",
        ...init.headers,
      },
    }
  );

  if (!response.ok) {
    const body = await parseErrorBody(response);
    throw new ApiClientError({
      kind: errorKind(response.status, body.error?.type),
      status: response.status,
      type: body.error?.type ?? null,
      message: body.error?.message ?? "Request failed",
    });
  }

  if (response.status === 204) {
    return undefined as Result;
  }

  return await response.json() as Result;
};

const filenameFromContentDisposition = (contentDisposition: string | null) => {
  const filenameMatch = contentDisposition?.match(/filename="([^"]+)"/i)
    ?? contentDisposition?.match(/filename=([^;]+)/i);
  const filename = filenameMatch?.[1]?.trim();

  return filename || null;
};

const requestBlob = async (
  path: string,
  fallbackFilename: string
): Promise<{ filename: string; blob: Blob }> => {
  const response = await fetch(
    joinUrl(apiBaseUrl(), path),
    {
      credentials: "include",
      headers: {
        accept: "application/zip",
      },
    }
  );

  if (!response.ok) {
    const body = await parseErrorBody(response);
    throw new ApiClientError({
      kind: errorKind(response.status, body.error?.type),
      status: response.status,
      type: body.error?.type ?? null,
      message: body.error?.message ?? "Request failed",
    });
  }

  return {
    filename: filenameFromContentDisposition(response.headers.get("content-disposition")) ?? fallbackFilename,
    blob: await response.blob(),
  };
};

export const resolveApiAssetUrl = (fileUrl: string, baseUrl = apiBaseUrl()) => (
  joinUrl(baseUrl, fileUrl)
);

export const getCurrentAuth = async (): Promise<AuthResponse> => (
  requestJson<AuthResponse>("/api/v1/authentication/me")
);

export const getPublicInstanceStatus = async (): Promise<PublicInstanceStatus> => (
  requestJson<PublicInstanceStatus>("/api/v1/public/instance")
);

export const completeFirstRunSetup = async (data: {
  owner: {
    email: string;
    password: string;
    first_name?: string | null;
    last_name?: string | null;
  };
  organization: {
    name: string;
  };
}): Promise<AuthResponse> => (
  requestJson<AuthResponse>("/api/v1/setup/first-run", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(data),
  })
);

export const login = async (data: {
  email: string;
  password: string;
}): Promise<AuthResponse> => (
  requestJson<AuthResponse>("/api/v1/authentication/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(data),
  })
);

export const logout = async (): Promise<void> => (
  requestJson<void>("/api/v1/authentication/logout", {
    method: "POST",
  })
);

export const listProjects = async (
  options: ListProjectsOptions = {}
): Promise<ProjectListResponse> => {
  const query = options.status ? `?status=${encodeURIComponent(options.status)}` : "";

  return requestJson<ProjectListResponse>(`/api/v1/projects${query}`);
};

export const createProject = async (
  input: CreateProjectInput
): Promise<ProjectCreateResponse> => (
  requestJson<ProjectCreateResponse>("/api/v1/projects", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  })
);

export const getProject = async (
  projectId: string
): Promise<ProjectDetailResponse> => (
  requestJson<ProjectDetailResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}`
  )
);

export const updateProject = async (
  projectId: string,
  input: UpdateProjectInput
): Promise<ProjectUpdateResponse> => (
  requestJson<ProjectUpdateResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    }
  )
);

export const getCaptureSessionDetail = async (
  projectId: string,
  captureSessionId: string
): Promise<CaptureSessionDetail> => {
  return requestJson<CaptureSessionDetail>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions/${encodeURIComponent(captureSessionId)}/detail`
  );
};

export const listProjectCaptureSessions = async (
  projectId: string,
  options: ListCaptureSessionsOptions = {}
): Promise<ProjectCaptureSessionListResponse> => {
  const query = options.status ? `?status=${encodeURIComponent(options.status)}` : "";

  return requestJson<ProjectCaptureSessionListResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions${query}`
  );
};

export const createProjectCaptureSession = async (
  projectId: string,
  input: CreateCaptureSessionInput
): Promise<CaptureSessionCreateResponse> => (
  requestJson<CaptureSessionCreateResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    }
  )
);

const appendOptionalFormValue = (formData: FormData, key: string, value?: string | null) => {
  if (value !== undefined && value !== null) {
    formData.append(key, value);
  }
};

export const uploadCaptureSessionAsset = async (
  projectId: string,
  captureSessionId: string,
  input: UploadCaptureAssetInput
): Promise<UploadCaptureAssetResponse> => {
  const formData = new FormData();
  formData.append("file", input.file);
  appendOptionalFormValue(formData, "page_url", input.page_url);
  appendOptionalFormValue(formData, "page_title", input.page_title);
  appendOptionalFormValue(formData, "captured_at", input.captured_at);

  return requestJson<UploadCaptureAssetResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions/${encodeURIComponent(captureSessionId)}/assets/upload`,
    {
      method: "POST",
      body: formData,
    }
  );
};

export const createCaptureSessionEvent = async (
  projectId: string,
  captureSessionId: string,
  input: CreateCaptureEventInput
): Promise<CreateCaptureEventResponse> => (
  requestJson<CreateCaptureEventResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions/${encodeURIComponent(captureSessionId)}/events`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    }
  )
);

export const reorderCaptureSessionEvents = async (
  projectId: string,
  captureSessionId: string,
  input: ReorderCaptureEventsInput
): Promise<ReorderCaptureEventsResponse> => (
  requestJson<ReorderCaptureEventsResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions/${encodeURIComponent(captureSessionId)}/events/order`,
    {
      method: "PUT",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    }
  )
);

export const updateCaptureSessionEvent = async (
  projectId: string,
  captureSessionId: string,
  eventId: string,
  input: UpdateCaptureEventInput
): Promise<UpdateCaptureEventResponse> => (
  requestJson<UpdateCaptureEventResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions/${encodeURIComponent(captureSessionId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    }
  )
);

export const getGuideDetail = async (
  projectId: string,
  guideId: string
): Promise<GuideDetail> => (
  requestJson<GuideDetail>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}`
  )
);

export const exportGuideMarkdown = async (
  projectId: string,
  guideId: string
): Promise<GuideMarkdownExport> => (
  requestJson<GuideMarkdownExport>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/export/markdown`
  )
);

export const exportGuideHtmlZip = async (
  projectId: string,
  guideId: string
): Promise<{ filename: string; blob: Blob }> => (
  requestBlob(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/export/html.zip`,
    "guide-html-export.zip"
  )
);

export const getGuidePublishStatus = async (
  projectId: string,
  guideId: string
): Promise<GuidePublishStatusResponse> => (
  requestJson<GuidePublishStatusResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/publish`
  )
);

export const getInteractiveDemoPublishStatus = async (
  projectId: string,
  interactiveDemoId: string
): Promise<GuidePublishStatusResponse> => (
  requestJson<GuidePublishStatusResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}/publish`
  )
);

export const publishGuide = async (
  projectId: string,
  guideId: string
): Promise<GuidePublishResult> => (
  requestJson<GuidePublishResult>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/publish`,
    {
      method: "POST",
    }
  )
);

export const publishInteractiveDemo = async (
  projectId: string,
  interactiveDemoId: string
): Promise<GuidePublishResult> => (
  requestJson<GuidePublishResult>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}/publish`,
    {
      method: "POST",
    }
  )
);

export const revokeGuidePublishLink = async (
  projectId: string,
  guideId: string
): Promise<GuideRevokePublishResult> => (
  requestJson<GuideRevokePublishResult>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/publish`,
    {
      method: "DELETE",
    }
  )
);

export const revokeInteractiveDemoPublishLink = async (
  projectId: string,
  interactiveDemoId: string
): Promise<GuideRevokePublishResult> => (
  requestJson<GuideRevokePublishResult>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}/publish`,
    {
      method: "DELETE",
    }
  )
);

export const updateGuidePublishAccess = async (
  projectId: string,
  guideId: string,
  input: UpdateGuidePublishAccessInput
): Promise<GuidePublishStatusResponse> => (
  requestJson<GuidePublishStatusResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/publish/access`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    }
  )
);

export const updateInteractiveDemoPublishAccess = async (
  projectId: string,
  interactiveDemoId: string,
  input: UpdateGuidePublishAccessInput
): Promise<GuidePublishStatusResponse> => (
  requestJson<GuidePublishStatusResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}/publish/access`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    }
  )
);

export const updateGuidePublishPassword = async (
  projectId: string,
  guideId: string,
  input: UpdateGuidePublishPasswordInput
): Promise<GuidePublishStatusResponse> => (
  requestJson<GuidePublishStatusResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/publish/password`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    }
  )
);

export const updateInteractiveDemoPublishPassword = async (
  projectId: string,
  interactiveDemoId: string,
  input: UpdateGuidePublishPasswordInput
): Promise<GuidePublishStatusResponse> => (
  requestJson<GuidePublishStatusResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}/publish/password`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    }
  )
);

export const getPublicPublishLink = async (
  slug: string
): Promise<PublicPublishLinkResponse> => (
  requestJson<PublicPublishLinkResponse>(
    `/api/v1/public/publish-links/${encodeURIComponent(slug)}`
  )
);

export const createPublicPublishViewerSession = async (
  slug: string,
  input: { password: string }
): Promise<void> => (
  requestJson<void>(
    `/api/v1/public/publish-links/${encodeURIComponent(slug)}/viewer-sessions`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    }
  )
);

export const listProjectGuides = async (
  projectId: string
): Promise<ProjectGuideListResponse> => (
  requestJson<ProjectGuideListResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides`
  )
);

export const listProjectScreenshotAssets = async (
  projectId: string
): Promise<ProjectScreenshotAssetListResponse> => (
  requestJson<ProjectScreenshotAssetListResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-assets?asset_type=screenshot`
  )
);

export const createGuideFromCaptureSession = async (
  projectId: string,
  captureSessionId: string,
  data: {
    title: string;
    description?: string | null;
  }
): Promise<GuideDetail> => (
  requestJson<GuideDetail>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/from-capture-session/${encodeURIComponent(captureSessionId)}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    }
  )
);

export const createInteractiveDemoFromCaptureSession = async (
  projectId: string,
  captureSessionId: string,
  data: {
    title?: string;
    description?: string | null;
  } = {}
): Promise<CreateInteractiveDemoFromCaptureResponse> => (
  requestJson<CreateInteractiveDemoFromCaptureResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions/${encodeURIComponent(captureSessionId)}/interactive-demos`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    }
  )
);

export const listProjectInteractiveDemos = async (
  projectId: string
): Promise<ProjectInteractiveDemoListResponse> => (
  requestJson<ProjectInteractiveDemoListResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos`
  )
);

export const getInteractiveDemo = async (
  projectId: string,
  interactiveDemoId: string
): Promise<InteractiveDemoDetailResponse> => (
  requestJson<InteractiveDemoDetailResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}`
  )
);

export const updateInteractiveDemo = async (
  projectId: string,
  interactiveDemoId: string,
  data: UpdateInteractiveDemoInput
): Promise<InteractiveDemoDetailResponse> => (
  requestJson<InteractiveDemoDetailResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    }
  )
);

export const archiveInteractiveDemo = async (
  projectId: string,
  interactiveDemoId: string
): Promise<void> => (
  requestJson<void>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}`,
    {
      method: "DELETE",
    }
  )
);

export const listInteractiveDemoScenes = async (
  projectId: string,
  interactiveDemoId: string
): Promise<InteractiveDemoSceneListResponse> => (
  requestJson<InteractiveDemoSceneListResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}/scenes`
  )
);

export const updateInteractiveDemoScene = async (
  projectId: string,
  interactiveDemoId: string,
  sceneId: string,
  data: UpdateDemoSceneInput
): Promise<InteractiveDemoSceneUpdateResponse> => (
  requestJson<InteractiveDemoSceneUpdateResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}/scenes/${encodeURIComponent(sceneId)}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    }
  )
);

export const reorderInteractiveDemoScenes = async (
  projectId: string,
  interactiveDemoId: string,
  sceneIds: string[]
): Promise<InteractiveDemoSceneReorderResponse> => (
  requestJson<InteractiveDemoSceneReorderResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}/scenes/order`,
    {
      method: "PUT",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        scene_ids: sceneIds,
      }),
    }
  )
);

export const deleteInteractiveDemoScene = async (
  projectId: string,
  interactiveDemoId: string,
  sceneId: string
): Promise<void> => (
  requestJson<void>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}/scenes/${encodeURIComponent(sceneId)}`,
    {
      method: "DELETE",
    }
  )
);

const demoHotspotsPath = (
  projectId: string,
  interactiveDemoId: string,
  sceneId: string
) => (
  `/api/v1/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}/scenes/${encodeURIComponent(sceneId)}/hotspots`
);

export const createInteractiveDemoHotspot = async (
  projectId: string,
  interactiveDemoId: string,
  sceneId: string,
  data: CreateDemoHotspotInput
): Promise<InteractiveDemoHotspotCreateResponse> => (
  requestJson<InteractiveDemoHotspotCreateResponse>(
    demoHotspotsPath(projectId, interactiveDemoId, sceneId),
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    }
  )
);

export const listInteractiveDemoHotspots = async (
  projectId: string,
  interactiveDemoId: string,
  sceneId: string
): Promise<InteractiveDemoHotspotListResponse> => (
  requestJson<InteractiveDemoHotspotListResponse>(
    demoHotspotsPath(projectId, interactiveDemoId, sceneId)
  )
);

export const updateInteractiveDemoHotspot = async (
  projectId: string,
  interactiveDemoId: string,
  sceneId: string,
  hotspotId: string,
  data: UpdateDemoHotspotInput
): Promise<InteractiveDemoHotspotUpdateResponse> => (
  requestJson<InteractiveDemoHotspotUpdateResponse>(
    `${demoHotspotsPath(projectId, interactiveDemoId, sceneId)}/${encodeURIComponent(hotspotId)}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    }
  )
);

export const reorderInteractiveDemoHotspots = async (
  projectId: string,
  interactiveDemoId: string,
  sceneId: string,
  hotspotIds: string[]
): Promise<InteractiveDemoHotspotReorderResponse> => (
  requestJson<InteractiveDemoHotspotReorderResponse>(
    `${demoHotspotsPath(projectId, interactiveDemoId, sceneId)}/order`,
    {
      method: "PUT",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        hotspot_ids: hotspotIds,
      }),
    }
  )
);

export const deleteInteractiveDemoHotspot = async (
  projectId: string,
  interactiveDemoId: string,
  sceneId: string,
  hotspotId: string
): Promise<void> => (
  requestJson<void>(
    `${demoHotspotsPath(projectId, interactiveDemoId, sceneId)}/${encodeURIComponent(hotspotId)}`,
    {
      method: "DELETE",
    }
  )
);

export const updateGuide = async (
  projectId: string,
  guideId: string,
  data: {
    title?: string;
    description?: string | null;
    status?: Guide["status"];
  }
): Promise<{ guide: Guide }> => (
  requestJson<{ guide: Guide }>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    }
  )
);

export const updateGuideStep = async (
  projectId: string,
  guideId: string,
  stepId: string,
  data: {
    title?: string;
    body?: string | null;
  }
): Promise<{ guide_step: GuideStep }> => (
  requestJson<{ guide_step: GuideStep }>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/steps/${encodeURIComponent(stepId)}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    }
  )
);

export const createGuideBlock = async (
  projectId: string,
  guideId: string,
  data: CreateGuideBlockInput
): Promise<{ guide_blocks: GuideBlock[] }> => (
  requestJson<{ guide_blocks: GuideBlock[] }>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/blocks`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    }
  )
);

export const updateGuideBlock = async (
  projectId: string,
  guideId: string,
  blockId: string,
  data: UpdateGuideBlockInput
): Promise<{ guide_block: GuideBlock }> => (
  requestJson<{ guide_block: GuideBlock }>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/blocks/${encodeURIComponent(blockId)}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    }
  )
);

export const updateGuideBlockScreenshot = async (
  projectId: string,
  guideId: string,
  blockId: string,
  data: UpdateGuideBlockScreenshotInput
): Promise<{ guide_block: GuideBlock }> => (
  requestJson<{ guide_block: GuideBlock }>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/blocks/${encodeURIComponent(blockId)}/screenshot`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    }
  )
);

export const updateGuideBlockAnnotations = async (
  projectId: string,
  guideId: string,
  blockId: string,
  data: UpdateGuideBlockAnnotationsInput
): Promise<{ guide_block: GuideBlock }> => (
  requestJson<{ guide_block: GuideBlock }>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/blocks/${encodeURIComponent(blockId)}/annotations`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    }
  )
);

export const uploadGuideBlockScreenshot = async (
  projectId: string,
  guideId: string,
  blockId: string,
  input: UploadGuideBlockScreenshotInput
): Promise<UploadGuideBlockScreenshotResponse> => {
  const body = new FormData();
  body.append("file", input.file);

  if (input.width !== undefined) {
    body.append("width", String(input.width));
  }
  if (input.height !== undefined) {
    body.append("height", String(input.height));
  }
  if (input.devicePixelRatio !== undefined) {
    body.append("device_pixel_ratio", String(input.devicePixelRatio));
  }
  if (input.pageUrl !== undefined) {
    body.append("page_url", input.pageUrl);
  }
  if (input.pageTitle !== undefined) {
    body.append("page_title", input.pageTitle);
  }
  if (input.capturedAt !== undefined) {
    body.append("captured_at", input.capturedAt);
  }
  if (input.metadata !== undefined) {
    body.append("metadata", JSON.stringify(input.metadata));
  }

  return requestJson<UploadGuideBlockScreenshotResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/blocks/${encodeURIComponent(blockId)}/screenshot-upload`,
    {
      method: "POST",
      body,
    }
  );
};

export const reorderGuideBlocks = async (
  projectId: string,
  guideId: string,
  blockIds: string[]
): Promise<{ guide_blocks: GuideBlock[] }> => (
  requestJson<{ guide_blocks: GuideBlock[] }>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/blocks/reorder`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        block_ids: blockIds,
      }),
    }
  )
);

export const deleteGuideBlock = async (
  projectId: string,
  guideId: string,
  blockId: string
): Promise<void> => (
  requestJson<void>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/blocks/${encodeURIComponent(blockId)}`,
    {
      method: "DELETE",
    }
  )
);
