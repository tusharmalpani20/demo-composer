import type { CaptureSessionDetail } from "../features/capture-session/types";

export type ApiClientErrorKind = "unauthenticated" | "not_found" | "validation" | "unknown";

type ApiErrorBody = {
  error?: {
    type?: string;
    message?: string;
  };
};

export class ApiClientError extends Error {
  kind: ApiClientErrorKind;
  status: number;

  constructor(input: { kind: ApiClientErrorKind; status: number; message: string }) {
    super(input.message);
    this.name = "ApiClientError";
    this.kind = input.kind;
    this.status = input.status;
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

export const resolveApiAssetUrl = (fileUrl: string, baseUrl = apiBaseUrl()) => (
  joinUrl(baseUrl, fileUrl)
);

export const getCaptureSessionDetail = async (
  projectId: string,
  captureSessionId: string
): Promise<CaptureSessionDetail> => {
  const response = await fetch(
    joinUrl(
      apiBaseUrl(),
      `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions/${encodeURIComponent(captureSessionId)}/detail`
    ),
    {
      credentials: "include",
      headers: {
        accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    const body = await parseErrorBody(response);
    throw new ApiClientError({
      kind: errorKind(response.status, body.error?.type),
      status: response.status,
      message: body.error?.message ?? "Request failed",
    });
  }

  return await response.json() as CaptureSessionDetail;
};
