import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ApiClientError,
  createCaptureSession,
  getCurrentAuth,
  listProjects,
  login,
  logout,
  type AuthResponse,
  type CaptureSessionResponse,
  type CreateCaptureSessionInput,
  type LoginResponse,
  type Project,
  type ProjectListResponse,
} from "./lib/api";
import { getCurrentTabSnapshot, type CurrentTabSnapshot } from "./lib/current-tab";
import {
  chromeLocalStorage,
  clearActiveCapture,
  clearSettings,
  emptySettings,
  getSettings,
  saveActiveCapture,
  saveInstanceUrl,
  saveSelectedProjectId,
  saveSessionToken,
  type ExtensionSettings,
  type ExtensionStorageArea,
} from "./lib/settings";
import { normalizeInstanceUrl } from "./lib/url";
import "./index.css";

type Dependencies = {
  getSettings: () => Promise<ExtensionSettings>;
  saveInstanceUrl: (instanceUrl: string) => Promise<void>;
  saveSessionToken: (sessionToken: string | null) => Promise<void>;
  saveSelectedProjectId: (projectId: string | null) => Promise<void>;
  saveActiveCapture: (input: { captureSessionId: string; projectId: string }) => Promise<void>;
  clearActiveCapture: () => Promise<void>;
  clearSettings: () => Promise<void>;
  getCurrentAuth: (instanceUrl: string, sessionToken: string) => Promise<AuthResponse>;
  login: (instanceUrl: string, data: { email: string; password: string }) => Promise<LoginResponse>;
  listProjects: (instanceUrl: string, sessionToken: string) => Promise<ProjectListResponse>;
  createCaptureSession: (
    instanceUrl: string,
    sessionToken: string,
    projectId: string,
    data: CreateCaptureSessionInput
  ) => Promise<CaptureSessionResponse>;
  getCurrentTabSnapshot: () => Promise<CurrentTabSnapshot>;
  logout: (instanceUrl: string, sessionToken: string) => Promise<void>;
};

type AppProps = {
  dependencies?: Partial<Dependencies>;
};

type ViewState =
  | { status: "loading" }
  | { status: "unconfigured"; settings: ExtensionSettings }
  | { status: "signed_out"; settings: ExtensionSettings }
  | {
    status: "signed_in";
    settings: ExtensionSettings & { instanceUrl: string; sessionToken: string };
    auth: AuthResponse["auth"];
    projects: Project[];
  }
  | { status: "error"; settings: ExtensionSettings; message: string };

const buildDefaultDependencies = (): Dependencies => {
  const storage: ExtensionStorageArea = chromeLocalStorage();

  return {
    getSettings: () => getSettings(storage),
    saveInstanceUrl: (instanceUrl) => saveInstanceUrl(storage, instanceUrl),
    saveSessionToken: (sessionToken) => saveSessionToken(storage, sessionToken),
    saveSelectedProjectId: (projectId) => saveSelectedProjectId(storage, projectId),
    saveActiveCapture: (input) => saveActiveCapture(storage, input),
    clearActiveCapture: () => clearActiveCapture(storage),
    clearSettings: () => clearSettings(storage),
    getCurrentAuth,
    login,
    listProjects,
    createCaptureSession,
    getCurrentTabSnapshot,
    logout,
  };
};

const errorMessage = (error: unknown, fallback: string) => (
  error instanceof ApiClientError ? error.message : fallback
);

export const App = ({ dependencies: dependencyOverrides }: AppProps) => {
  const dependencies = useMemo<Dependencies>(() => ({
    ...buildDefaultDependencies(),
    ...(dependencyOverrides ?? {}),
  }), [dependencyOverrides]);
  const [state, setState] = useState<ViewState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    const load = async () => {
      const settings = await dependencies.getSettings();

      if (!settings.instanceUrl) {
        if (active) {
          setState({ status: "unconfigured", settings });
        }
        return;
      }

      if (!settings.sessionToken) {
        if (active) {
          setState({ status: "signed_out", settings });
        }
        return;
      }

      try {
        const [authResponse, projectResponse] = await Promise.all([
          dependencies.getCurrentAuth(settings.instanceUrl, settings.sessionToken),
          dependencies.listProjects(settings.instanceUrl, settings.sessionToken),
        ]);
        const selectedProjectExists = settings.selectedProjectId
          ? projectResponse.projects.some((project) => project.id === settings.selectedProjectId)
          : true;
        const nextSettings = selectedProjectExists
          ? settings
          : { ...settings, selectedProjectId: null };

        if (!selectedProjectExists) {
          await dependencies.saveSelectedProjectId(null);
        }

        if (active) {
          setState({
            status: "signed_in",
            settings: {
              ...nextSettings,
              instanceUrl: settings.instanceUrl,
              sessionToken: settings.sessionToken,
            },
            auth: authResponse.auth,
            projects: projectResponse.projects,
          });
        }
      } catch (error: unknown) {
        if (error instanceof ApiClientError && error.type === "unauthenticated") {
          await dependencies.saveSessionToken(null);

          if (active) {
            setState({
              status: "signed_out",
              settings: {
                ...settings,
                sessionToken: null,
                activeCaptureSessionId: null,
                activeCaptureProjectId: null,
              },
            });
          }
          return;
        }

        if (active) {
          setState({
            status: "error",
            settings,
            message: errorMessage(error, "Could not load projects."),
          });
        }
      }
    };

    load().catch((error: unknown) => {
      if (active) {
        setState({
          status: "error",
          settings: emptySettings(),
          message: errorMessage(error, "Could not load extension settings."),
        });
      }
    });

    return () => {
      active = false;
    };
  }, [dependencies, reloadKey]);

  const reload = () => setReloadKey((key) => key + 1);

  if (state.status === "loading") {
    return <Shell><div className="state">Loading...</div></Shell>;
  }

  if (state.status === "unconfigured") {
    return (
      <Shell>
        <ConnectInstance
          onSave={async (instanceUrl) => {
            await dependencies.saveInstanceUrl(instanceUrl);
            reload();
          }}
        />
      </Shell>
    );
  }

  if (state.status === "signed_out") {
    return (
      <Shell>
        <SignIn
          instanceUrl={state.settings.instanceUrl ?? ""}
          onChangeInstance={async () => {
            await dependencies.clearSettings();
            reload();
          }}
          onSignIn={async (data) => {
            const result = await dependencies.login(state.settings.instanceUrl ?? "", data);
            await dependencies.saveSessionToken(result.session_token);
            const projectResponse = await dependencies.listProjects(
              state.settings.instanceUrl ?? "",
              result.session_token
            );
            setState({
              status: "signed_in",
              settings: {
                instanceUrl: state.settings.instanceUrl ?? "",
                sessionToken: result.session_token,
                selectedProjectId: null,
                activeCaptureSessionId: null,
                activeCaptureProjectId: null,
              },
              auth: result.auth,
              projects: projectResponse.projects,
            });
          }}
        />
      </Shell>
    );
  }

  if (state.status === "error") {
    return (
      <Shell>
        <div className="panel">
          <h1>Connection issue</h1>
          <p className="error">{state.message}</p>
          <div className="actions">
            <button type="button" onClick={reload}>Retry</button>
            <button
              type="button"
              className="secondary"
              onClick={async () => {
                await dependencies.clearSettings();
                reload();
              }}
            >
              Change instance
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <ProjectPicker
        auth={state.auth}
        projects={state.projects}
        selectedProjectId={state.settings.selectedProjectId}
        activeCaptureSessionId={state.settings.activeCaptureSessionId}
        activeCaptureProjectId={state.settings.activeCaptureProjectId}
        onSelect={async (projectId) => {
          await dependencies.saveSelectedProjectId(projectId);
          setState({
            ...state,
            settings: {
              ...state.settings,
              selectedProjectId: projectId,
            },
          });
        }}
        onStartCapture={async (projectId) => {
          const tab = await dependencies.getCurrentTabSnapshot();
          const result = await dependencies.createCaptureSession(
            state.settings.instanceUrl,
            state.settings.sessionToken,
            projectId,
            buildCaptureSessionInput({
              project: state.projects.find((project) => project.id === projectId) ?? null,
              tab,
            })
          );

          await dependencies.saveActiveCapture({
            captureSessionId: result.capture_session.id,
            projectId,
          });
          setState({
            ...state,
            settings: {
              ...state.settings,
              activeCaptureSessionId: result.capture_session.id,
              activeCaptureProjectId: projectId,
            },
          });
        }}
        onDiscardActiveCapture={async () => {
          await dependencies.clearActiveCapture();
          setState({
            ...state,
            settings: {
              ...state.settings,
              activeCaptureSessionId: null,
              activeCaptureProjectId: null,
            },
          });
        }}
        onChangeInstance={async () => {
          await dependencies.clearSettings();
          reload();
        }}
        onSignOut={async () => {
          try {
            await dependencies.logout(state.settings.instanceUrl, state.settings.sessionToken);
          } catch {
            // Local sign-out must still work when the instance is unreachable.
          }

          await dependencies.saveSessionToken(null);
          reload();
        }}
      />
    </Shell>
  );
};

const buildCaptureName = (input: {
  project: Project | null;
  tab: CurrentTabSnapshot;
}) => {
  const tabTitle = input.tab.title?.trim();

  if (tabTitle) {
    return `Capture from ${tabTitle}`;
  }

  const projectName = input.project?.name.trim();

  if (projectName) {
    return `Capture from ${projectName}`;
  }

  return "Extension capture";
};

const browserNameFromUserAgent = (userAgent: string | null) => {
  if (!userAgent) {
    return null;
  }

  return userAgent.includes("Chrome") ? "Chrome" : null;
};

const buildCaptureSessionInput = (input: {
  project: Project | null;
  tab: CurrentTabSnapshot;
}): CreateCaptureSessionInput => {
  const userAgent = typeof navigator === "undefined" ? null : navigator.userAgent;

  return {
    name: buildCaptureName(input),
    source_type: "extension",
    start_url: input.tab.url,
    browser_name: browserNameFromUserAgent(userAgent),
    user_agent: userAgent,
    metadata: {
      extension_version: "0.1.0",
      tab_title: input.tab.title,
    },
  };
};

const Shell = ({ children }: { children: React.ReactNode }) => (
  <main className="popup">
    <div className="brand">Demo Composer</div>
    {children}
  </main>
);

const ConnectInstance = ({
  onSave,
}: {
  onSave: (instanceUrl: string) => Promise<void>;
}) => {
  const [instanceUrl, setInstanceUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = normalizeInstanceUrl(instanceUrl);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSave(result.value);
    } catch {
      setError("Could not save instance URL.");
      setSubmitting(false);
    }
  };

  return (
    <section className="panel" aria-labelledby="connect-heading">
      <h1 id="connect-heading">Connect instance</h1>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          <span>Instance URL</span>
          <input
            type="url"
            value={instanceUrl}
            placeholder="http://localhost:4000"
            disabled={submitting}
            onChange={(event) => setInstanceUrl(event.target.value)}
          />
        </label>
        {error ? <div className="error">{error}</div> : null}
        <button type="submit" disabled={submitting}>
          {submitting ? "Connecting..." : "Connect"}
        </button>
      </form>
    </section>
  );
};

const SignIn = ({
  instanceUrl,
  onSignIn,
  onChangeInstance,
}: {
  instanceUrl: string;
  onSignIn: (data: { email: string; password: string }) => Promise<void>;
  onChangeInstance: () => Promise<void>;
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await onSignIn({
        email: email.trim(),
        password,
      });
    } catch (submitError: unknown) {
      setError(errorMessage(submitError, "Could not sign in."));
      setSubmitting(false);
    }
  };

  return (
    <section className="panel" aria-labelledby="sign-in-heading">
      <h1 id="sign-in-heading">Sign in</h1>
      <p className="instance">{instanceUrl}</p>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          <span>Email</span>
          <input
            type="email"
            value={email}
            autoComplete="email"
            disabled={submitting}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          <span>Password</span>
          <input
            type="password"
            value={password}
            autoComplete="current-password"
            disabled={submitting}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error ? <div className="error">{error}</div> : null}
        <div className="actions">
          <button type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </button>
          <button type="button" className="secondary" disabled={submitting} onClick={() => void onChangeInstance()}>
            Change instance
          </button>
        </div>
      </form>
    </section>
  );
};

const ProjectPicker = ({
  auth,
  projects,
  selectedProjectId,
  activeCaptureSessionId,
  activeCaptureProjectId,
  onSelect,
  onStartCapture,
  onDiscardActiveCapture,
  onChangeInstance,
  onSignOut,
}: {
  auth: AuthResponse["auth"];
  projects: Project[];
  selectedProjectId: string | null;
  activeCaptureSessionId: string | null;
  activeCaptureProjectId: string | null;
  onSelect: (projectId: string) => Promise<void>;
  onStartCapture: (projectId: string) => Promise<void>;
  onDiscardActiveCapture: () => Promise<void>;
  onChangeInstance: () => Promise<void>;
  onSignOut: () => Promise<void>;
}) => {
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const selectedProject = selectedProjectId
    ? projects.find((project) => project.id === selectedProjectId) ?? null
    : null;
  const activeProject = activeCaptureProjectId
    ? projects.find((project) => project.id === activeCaptureProjectId) ?? null
    : null;
  const hasActiveCapture = Boolean(activeCaptureSessionId && activeCaptureProjectId);

  const heading = hasActiveCapture
    ? "Capture active"
    : selectedProject
      ? "Ready to capture"
      : "Select project";

  const handleStartCapture = async () => {
    if (!selectedProject || starting) {
      return;
    }

    setStarting(true);
    setStartError(null);

    try {
      await onStartCapture(selectedProject.id);
      setStarting(false);
    } catch (error: unknown) {
      setStartError(errorMessage(error, "Could not start capture."));
      setStarting(false);
    }
  };

  return (
    <section className="panel" aria-labelledby="project-heading">
      <div className="toolbar">
        <div>
          <h1 id="project-heading">{heading}</h1>
          <p className="identity">{auth.user.email}</p>
          <p className="instance">{auth.organization.name}</p>
        </div>
        <div className="toolbarActions">
          <button type="button" className="secondary" disabled={starting} onClick={() => void onChangeInstance()}>
            Change instance
          </button>
          <button type="button" className="secondary" disabled={starting} onClick={() => void onSignOut()}>
            Sign out
          </button>
        </div>
      </div>

      {hasActiveCapture ? (
        <div className="captureState">
          <p className="captureProject">{activeProject?.name ?? "Project unavailable"}</p>
          <p className="captureSession">Session {activeCaptureSessionId}</p>
          <button type="button" className="secondary" onClick={() => void onDiscardActiveCapture()}>
            Discard local capture state
          </button>
        </div>
      ) : null}

      {!hasActiveCapture && selectedProject ? (
        <div className="captureState">
          <p className="captureProject">{selectedProject.name}</p>
          {startError ? <div className="error">{startError}</div> : null}
          <button type="button" disabled={starting} onClick={() => void handleStartCapture()}>
            {starting ? "Starting..." : "Start capture"}
          </button>
        </div>
      ) : null}

      {!hasActiveCapture && projects.length === 0 ? (
        <div className="state">No projects yet.</div>
      ) : null}

      {!hasActiveCapture && projects.length > 0 ? (
        <div className="projects">
          {projects.map((project) => (
            <button
              type="button"
              className={project.id === selectedProjectId ? "project selected" : "project"}
              disabled={starting}
              key={project.id}
              onClick={() => void onSelect(project.id)}
            >
              <span>Use <strong>{project.name}</strong></span>
              <small>{project.status}</small>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
};
