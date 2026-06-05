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
