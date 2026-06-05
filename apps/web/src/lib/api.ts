import type {
  CaptureSession,
  CaptureSessionDetail,
  CaptureSessionStatus,
} from "../features/capture-session/types";
import type { AuthResponse } from "../features/auth/types";
import type { Guide, GuideBlock, GuideDetail, GuideStep } from "../features/guide/types";
import type { Project } from "../features/project/types";

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

export type ProjectCaptureSessionListResponse = {
  capture_sessions: CaptureSession[];
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

export const getGuideDetail = async (
  projectId: string,
  guideId: string
): Promise<GuideDetail> => (
  requestJson<GuideDetail>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}`
  )
);

export const listProjectGuides = async (
  projectId: string
): Promise<ProjectGuideListResponse> => (
  requestJson<ProjectGuideListResponse>(
    `/api/v1/projects/${encodeURIComponent(projectId)}/guides`
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
