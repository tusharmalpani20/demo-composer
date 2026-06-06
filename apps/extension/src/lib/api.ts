export type AuthResponse = {
  auth: {
    user: {
      id: string;
      email: string;
      display_name: string;
    };
    organization: {
      id: string;
      name: string;
    };
    org_user: {
      id: string;
      role: string;
    };
    session: {
      id: string;
      session_type: string;
      expires_at: string;
    };
  };
};

export type LoginResponse = AuthResponse & {
  session_token: string;
};

export type Project = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  slug: string | null;
  color: string | null;
  icon: string | null;
  status: "active" | "archived";
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: string;
  updated_at: string;
};

export type ProjectListResponse = {
  projects: Project[];
};

export type CaptureSession = {
  id: string;
  project_id: string;
  source_type: "manual" | "extension" | "import";
  status: "draft" | "capturing" | "completed" | "canceled" | "archived";
};

export type CreateCaptureSessionInput = {
  name: string;
  description?: string | null;
  source_type: "extension";
  start_url?: string | null;
  browser_name?: string | null;
  browser_version?: string | null;
  operating_system?: string | null;
  viewport_width?: number | null;
  viewport_height?: number | null;
  device_pixel_ratio?: number | null;
  user_agent?: string | null;
  metadata?: Record<string, unknown>;
};

export type CaptureSessionResponse = {
  capture_session: CaptureSession;
};

export type CompleteCaptureSessionResponse = {
  capture_session: CaptureSession;
  redirect: {
    path: string;
    reason: "capture_session_completed";
  };
};

export type CaptureAsset = {
  id: string;
  project_id: string;
  capture_session_id: string;
  asset_type: "screenshot" | "html_snapshot" | "thumbnail" | "redacted_screenshot";
  width: number | null;
  height: number | null;
  device_pixel_ratio: number | null;
  page_url: string | null;
  page_title: string | null;
  captured_at: string | null;
};

export type CaptureAssetResponse = {
  capture_asset: CaptureAsset;
};

export type UploadCaptureAssetInput = {
  file: Blob;
  fileName: string;
  width?: number | null;
  height?: number | null;
  devicePixelRatio?: number | null;
  pageUrl?: string | null;
  pageTitle?: string | null;
  capturedAt?: string | null;
  metadata?: Record<string, unknown>;
};

export type CaptureEventType = "navigation" | "click" | "input" | "capture" | "note";

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

export type CaptureEventResponse = {
  capture_event: CaptureEvent;
};

export type CreateCaptureEventInput = {
  event_type: "capture";
  event_index: number;
  capture_asset_id: string;
  occurred_at?: string | null;
  page_url?: string | null;
  page_title?: string | null;
  input_value_redacted?: true;
  metadata?: Record<string, unknown>;
};

type ApiErrorBody = {
  error?: {
    type?: string;
    message?: string;
  };
};

export class ApiClientError extends Error {
  status: number;
  type: string | null;

  constructor(input: { status: number; message: string; type?: string | null }) {
    super(input.message);
    this.name = "ApiClientError";
    this.status = input.status;
    this.type = input.type ?? null;
  }
}

const joinApiUrl = (instanceUrl: string, path: string) => (
  `${instanceUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`
);

const parseErrorBody = async (response: Response): Promise<ApiErrorBody> => {
  try {
    return await response.json() as ApiErrorBody;
  } catch {
    return {};
  }
};

const authHeaders = (sessionToken?: string | null) => ({
  accept: "application/json",
  ...(sessionToken ? { authorization: `Bearer ${sessionToken}` } : {}),
});

const requestJson = async <Result>(
  instanceUrl: string,
  path: string,
  init: RequestInit = {}
): Promise<Result> => {
  const response = await fetch(joinApiUrl(instanceUrl, path), {
    ...init,
    credentials: "include",
    headers: {
      ...authHeaders(),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = await parseErrorBody(response);
    throw new ApiClientError({
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

const appendOptionalFormValue = (
  formData: FormData,
  name: string,
  value: string | number | null | undefined
) => {
  if (value === null || value === undefined) {
    return;
  }

  formData.append(name, String(value));
};

export const login = async (
  instanceUrl: string,
  data: {
    email: string;
    password: string;
  }
): Promise<LoginResponse> => (
  requestJson<LoginResponse>(instanceUrl, "/api/v1/authentication/login", {
    method: "POST",
    headers: {
      ...authHeaders(),
      "content-type": "application/json",
      "x-demo-composer-client": "extension",
    },
    body: JSON.stringify(data),
  })
);

export const getCurrentAuth = async (
  instanceUrl: string,
  sessionToken: string
): Promise<AuthResponse> => (
  requestJson<AuthResponse>(instanceUrl, "/api/v1/authentication/me", {
    headers: authHeaders(sessionToken),
  })
);

export const listProjects = async (
  instanceUrl: string,
  sessionToken: string
): Promise<ProjectListResponse> => (
  requestJson<ProjectListResponse>(instanceUrl, "/api/v1/projects", {
    headers: authHeaders(sessionToken),
  })
);

export const logout = async (
  instanceUrl: string,
  sessionToken: string
): Promise<void> => (
  requestJson<void>(instanceUrl, "/api/v1/authentication/logout", {
    method: "POST",
    headers: authHeaders(sessionToken),
  })
);

export const createCaptureSession = async (
  instanceUrl: string,
  sessionToken: string,
  projectId: string,
  data: CreateCaptureSessionInput
): Promise<CaptureSessionResponse> => (
  requestJson<CaptureSessionResponse>(
    instanceUrl,
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions`,
    {
      method: "POST",
      headers: {
        ...authHeaders(sessionToken),
        "content-type": "application/json",
        "x-demo-composer-client": "extension",
      },
      body: JSON.stringify({
        ...data,
        source_type: "extension",
      }),
    }
  )
);

export const uploadCaptureAsset = async (
  instanceUrl: string,
  sessionToken: string,
  projectId: string,
  captureSessionId: string,
  data: UploadCaptureAssetInput
): Promise<CaptureAssetResponse> => {
  const formData = new FormData();
  formData.append("file", data.file, data.fileName);
  appendOptionalFormValue(formData, "width", data.width);
  appendOptionalFormValue(formData, "height", data.height);
  appendOptionalFormValue(formData, "device_pixel_ratio", data.devicePixelRatio);
  appendOptionalFormValue(formData, "page_url", data.pageUrl);
  appendOptionalFormValue(formData, "page_title", data.pageTitle);
  appendOptionalFormValue(formData, "captured_at", data.capturedAt);

  if (data.metadata !== undefined) {
    formData.append("metadata", JSON.stringify(data.metadata));
  }

  return requestJson<CaptureAssetResponse>(
    instanceUrl,
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions/${encodeURIComponent(captureSessionId)}/assets/upload`,
    {
      method: "POST",
      headers: {
        ...authHeaders(sessionToken),
        "x-demo-composer-client": "extension",
      },
      body: formData,
    }
  );
};

export const createCaptureEvent = async (
  instanceUrl: string,
  sessionToken: string,
  projectId: string,
  captureSessionId: string,
  data: CreateCaptureEventInput
): Promise<CaptureEventResponse> => (
  requestJson<CaptureEventResponse>(
    instanceUrl,
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions/${encodeURIComponent(captureSessionId)}/events`,
    {
      method: "POST",
      headers: {
        ...authHeaders(sessionToken),
        "content-type": "application/json",
        "x-demo-composer-client": "extension",
      },
      body: JSON.stringify({
        ...data,
        input_value_redacted: true,
      }),
    }
  )
);

export const completeCaptureSession = async (
  instanceUrl: string,
  sessionToken: string,
  projectId: string,
  captureSessionId: string
): Promise<CompleteCaptureSessionResponse> => (
  requestJson<CompleteCaptureSessionResponse>(
    instanceUrl,
    `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions/${encodeURIComponent(captureSessionId)}/complete`,
    {
      method: "POST",
      headers: {
        ...authHeaders(sessionToken),
        "x-demo-composer-client": "extension",
      },
    }
  )
);
