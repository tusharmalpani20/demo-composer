import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ApiClientError,
  getCurrentAuth,
  listProjects,
  login,
  logout,
  type AuthResponse,
  type LoginResponse,
  type Project,
  type ProjectListResponse,
} from "./lib/api";
import {
  chromeLocalStorage,
  clearSettings,
  emptySettings,
  getSettings,
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
  clearSettings: () => Promise<void>;
  getCurrentAuth: (instanceUrl: string, sessionToken: string) => Promise<AuthResponse>;
  login: (instanceUrl: string, data: { email: string; password: string }) => Promise<LoginResponse>;
  listProjects: (instanceUrl: string, sessionToken: string) => Promise<ProjectListResponse>;
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
    clearSettings: () => clearSettings(storage),
    getCurrentAuth,
    login,
    listProjects,
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
        onChangeInstance={async () => {
          await dependencies.clearSettings();
          reload();
        }}
        onSignOut={async () => {
          await dependencies.logout(state.settings.instanceUrl, state.settings.sessionToken);
          await dependencies.saveSessionToken(null);
          reload();
        }}
      />
    </Shell>
  );
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
  onSelect,
  onChangeInstance,
  onSignOut,
}: {
  auth: AuthResponse["auth"];
  projects: Project[];
  selectedProjectId: string | null;
  onSelect: (projectId: string) => Promise<void>;
  onChangeInstance: () => Promise<void>;
  onSignOut: () => Promise<void>;
}) => (
  <section className="panel" aria-labelledby="project-heading">
    <div className="toolbar">
      <div>
        <h1 id="project-heading">Select project</h1>
        <p className="identity">{auth.user.email}</p>
        <p className="instance">{auth.organization.name}</p>
      </div>
      <div className="toolbarActions">
        <button type="button" className="secondary" onClick={() => void onChangeInstance()}>
          Change instance
        </button>
        <button type="button" className="secondary" onClick={() => void onSignOut()}>
          Sign out
        </button>
      </div>
    </div>
    {projects.length === 0 ? (
      <div className="state">No projects yet.</div>
    ) : (
      <div className="projects">
        {projects.map((project) => (
          <button
            type="button"
            className={project.id === selectedProjectId ? "project selected" : "project"}
            key={project.id}
            onClick={() => void onSelect(project.id)}
          >
            <span>Use <strong>{project.name}</strong></span>
            <small>{project.status}</small>
          </button>
        ))}
      </div>
    )}
  </section>
);
