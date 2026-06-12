import type {
  CaptureSession,
  CaptureSessionDetail,
  CaptureSessionStatus,
  CreateCaptureEventInput,
  CreateCaptureEventResponse,
  CreateCaptureSessionInput,
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
  UploadGuideBlockScreenshotInput,
  UploadGuideBlockScreenshotResponse,
} from "../features/guide/types";
import type { CreateProjectInput, Project, ProjectStatus } from "../features/project/types";

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

export type ProjectDetailResponse = {
  project: Project;
};

export type ProjectListResponse = {
  projects: Project[];
};

export type ProjectCreateResponse = {
  project: Project;
};

export type ProjectCaptureSessionListResponse = {
  capture_sessions: CaptureSession[];
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

export const resolveApiAssetUrl = (fileUrl: string, baseUrl = apiBaseUrl()) => (
  joinUrl(baseUrl, fileUrl)
);

export const getCurrentAuth = async (): Promise<AuthResponse> => (
  requestJson<AuthResponse>("/api/v1/authentication/me")
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

export const getGuidePublishStatus = async (
  projectId: string,
  guideId: string
): Promise<GuidePublishStatusResponse> => (
  requestJson<GuidePublishStatusResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/publish`
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

export const getPublicPublishLink = async (
  slug: string
): Promise<PublicPublishLinkResponse> => (
  requestJson<PublicPublishLinkResponse>(
    `/api/v1/public/publish-links/${encodeURIComponent(slug)}`
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
