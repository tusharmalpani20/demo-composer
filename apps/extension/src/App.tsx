import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ApiClientError,
  completeCaptureSession,
  createCaptureEvent,
  createCaptureSession,
  getCurrentAuth,
  listProjects,
  login,
  logout,
  type AuthResponse,
  type CaptureAssetResponse,
  type CaptureEventResponse,
  type CaptureSessionResponse,
  type CompleteCaptureSessionResponse,
  type CreateCaptureEventInput,
  type CreateCaptureSessionInput,
  type LoginResponse,
  type Project,
  type ProjectListResponse,
  type UploadCaptureAssetInput,
  uploadCaptureAsset,
} from "./lib/api";
import { getCurrentTabSnapshot, type CurrentTabSnapshot } from "./lib/current-tab";
import { openPortalUrl } from "./lib/navigation";
import { captureVisibleTabScreenshot, type ScreenshotCapture } from "./lib/screenshot";
import {
  chromeLocalStorage,
  clearActiveCapture,
  clearSettings,
  emptySettings,
  getSettings,
  saveActiveCapture,
  saveActiveCaptureEventIndex,
  saveActiveCaptureMode,
  saveInstanceUrl,
  savePortalUrl,
  saveSelectedProjectId,
  saveSessionToken,
  type ExtensionSettings,
  type ExtensionStorageArea,
} from "./lib/settings";
import { buildPortalCaptureSessionUrl, normalizeInstanceUrl } from "./lib/url";
import "./index.css";

type Dependencies = {
  getSettings: () => Promise<ExtensionSettings>;
  saveInstanceUrl: (instanceUrl: string) => Promise<void>;
  savePortalUrl: (portalUrl: string | null) => Promise<void>;
  saveSessionToken: (sessionToken: string | null) => Promise<void>;
  saveSelectedProjectId: (projectId: string | null) => Promise<void>;
  saveActiveCapture: (input: {
    captureSessionId: string;
    projectId: string;
    eventIndex?: number;
    mode?: "manual" | "automatic";
  }) => Promise<void>;
  saveActiveCaptureMode: (input: { mode: "manual" | "automatic"; paused: boolean }) => Promise<void>;
  saveActiveCaptureEventIndex: (eventIndex: number) => Promise<void>;
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
  captureVisibleTabScreenshot: () => Promise<ScreenshotCapture>;
  uploadCaptureAsset: (
    instanceUrl: string,
    sessionToken: string,
    projectId: string,
    captureSessionId: string,
    data: UploadCaptureAssetInput
  ) => Promise<CaptureAssetResponse>;
  createCaptureEvent: (
    instanceUrl: string,
    sessionToken: string,
    projectId: string,
    captureSessionId: string,
    data: CreateCaptureEventInput
  ) => Promise<CaptureEventResponse>;
  completeCaptureSession: (
    instanceUrl: string,
    sessionToken: string,
    projectId: string,
    captureSessionId: string
  ) => Promise<CompleteCaptureSessionResponse>;
  openPortalUrl: (url: string) => Promise<void>;
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
    savePortalUrl: (portalUrl) => savePortalUrl(storage, portalUrl),
    saveSessionToken: (sessionToken) => saveSessionToken(storage, sessionToken),
    saveSelectedProjectId: (projectId) => saveSelectedProjectId(storage, projectId),
    saveActiveCapture: (input) => saveActiveCapture(storage, input),
    saveActiveCaptureMode: (input) => saveActiveCaptureMode(storage, input),
    saveActiveCaptureEventIndex: (eventIndex) => saveActiveCaptureEventIndex(storage, eventIndex),
    clearActiveCapture: () => clearActiveCapture(storage),
    clearSettings: () => clearSettings(storage),
    getCurrentAuth,
    login,
    listProjects,
    createCaptureSession,
    getCurrentTabSnapshot,
    captureVisibleTabScreenshot,
    uploadCaptureAsset,
    createCaptureEvent,
    completeCaptureSession,
    openPortalUrl,
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
                activeCaptureEventIndex: null,
                activeCaptureMode: null,
                activeCapturePaused: false,
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
            await dependencies.saveInstanceUrl(instanceUrl.instanceUrl);
            if (instanceUrl.portalUrl) {
              await dependencies.savePortalUrl(instanceUrl.portalUrl);
            }
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
                portalUrl: state.settings.portalUrl ?? null,
                sessionToken: result.session_token,
                selectedProjectId: null,
                activeCaptureSessionId: null,
                activeCaptureProjectId: null,
                activeCaptureEventIndex: null,
                activeCaptureMode: null,
                activeCapturePaused: false,
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
        activeCaptureEventIndex={state.settings.activeCaptureEventIndex}
        activeCaptureMode={state.settings.activeCaptureMode}
        activeCapturePaused={state.settings.activeCapturePaused}
        automaticCaptureDiagnostic={state.settings.automaticCaptureDiagnostic ?? null}
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
            eventIndex: 0,
            mode: "automatic",
          });
          setState({
            ...state,
            settings: {
              ...state.settings,
              activeCaptureSessionId: result.capture_session.id,
              activeCaptureProjectId: projectId,
              activeCaptureEventIndex: 0,
              activeCaptureMode: "automatic",
              activeCapturePaused: false,
            },
          });
        }}
        onSetActiveCaptureMode={async (input) => {
          await dependencies.saveActiveCaptureMode(input);
          setState({
            ...state,
            settings: {
              ...state.settings,
              activeCaptureMode: input.mode,
              activeCapturePaused: input.paused,
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
              activeCaptureEventIndex: null,
              activeCaptureMode: null,
              activeCapturePaused: false,
            },
          });
        }}
        onCaptureScreenshot={async (input) => {
          const [screenshot, tab] = await Promise.all([
            dependencies.captureVisibleTabScreenshot(),
            dependencies.getCurrentTabSnapshot(),
          ]);
          const captureAssetResult = await dependencies.uploadCaptureAsset(
            state.settings.instanceUrl,
            state.settings.sessionToken,
            input.projectId,
            input.captureSessionId,
            {
              file: screenshot.blob,
              fileName: screenshotFileName(screenshot.capturedAt),
              width: screenshot.width,
              height: screenshot.height,
              devicePixelRatio: screenshot.devicePixelRatio,
              pageUrl: tab.url,
              pageTitle: tab.title,
              capturedAt: screenshot.capturedAt,
              metadata: {
                extension_version: "0.1.0",
                capture_source: "extension_popup",
              },
            }
          );
          const result = await dependencies.createCaptureEvent(
            state.settings.instanceUrl,
            state.settings.sessionToken,
            input.projectId,
            input.captureSessionId,
            {
              event_type: "capture",
              event_index: input.eventIndex,
              capture_asset_id: captureAssetResult.capture_asset.id,
              occurred_at: screenshot.capturedAt,
              page_url: tab.url,
              page_title: tab.title,
              input_value_redacted: true,
              metadata: {
                extension_version: "0.1.0",
                capture_source: "extension_popup",
                asset_type: "screenshot",
              },
            }
          );
          await dependencies.saveActiveCaptureEventIndex(input.eventIndex);
          setState({
            ...state,
            settings: {
              ...state.settings,
              activeCaptureEventIndex: input.eventIndex,
            },
          });

          return result;
        }}
        onFinishCapture={async (input) => {
          const result = await dependencies.completeCaptureSession(
            state.settings.instanceUrl,
            state.settings.sessionToken,
            input.projectId,
            input.captureSessionId
          );
          const portalUrl = buildPortalCaptureSessionUrl(
            state.settings.instanceUrl,
            state.settings.portalUrl,
            result.redirect.path,
            input.projectId,
            input.captureSessionId
          );

          await dependencies.clearActiveCapture();
          setState({
            ...state,
            settings: {
              ...state.settings,
              activeCaptureSessionId: null,
              activeCaptureProjectId: null,
              activeCaptureEventIndex: null,
              activeCaptureMode: null,
              activeCapturePaused: false,
            },
          });

          try {
            await dependencies.openPortalUrl(portalUrl);
          } catch {
            throw new ApiClientError({
              status: 0,
              type: "portal_open_failed",
              message: "Could not open portal after finishing capture.",
            });
          }
        }}
        onOpenActiveCapture={async (input) => {
          const portalUrl = buildPortalCaptureSessionUrl(
            state.settings.instanceUrl,
            state.settings.portalUrl,
            null,
            input.projectId,
            input.captureSessionId
          );

          try {
            await dependencies.openPortalUrl(portalUrl);
          } catch {
            throw new ApiClientError({
              status: 0,
              type: "portal_open_failed",
              message: "Could not open capture in portal.",
            });
          }
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

const screenshotFileName = (capturedAt: string) => (
  `screenshot-${capturedAt.replace(/[:.]/g, "-")}.png`
);

const Shell = ({ children }: { children: React.ReactNode }) => (
  <main className="popup">
    <div className="brand">Demo Composer</div>
    {children}
  </main>
);

const ConnectInstance = ({
  onSave,
}: {
  onSave: (input: { instanceUrl: string; portalUrl: string | null }) => Promise<void>;
}) => {
  const [instanceUrl, setInstanceUrl] = useState("");
  const [portalUrl, setPortalUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = normalizeInstanceUrl(instanceUrl);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    const portalUrlValue = portalUrl.trim();
    const normalizedPortalUrl = portalUrlValue ? normalizeInstanceUrl(portalUrlValue) : null;
    if (normalizedPortalUrl && !normalizedPortalUrl.ok) {
      setError("Enter a valid http:// or https:// portal URL.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSave({
        instanceUrl: result.value,
        portalUrl: normalizedPortalUrl?.value ?? null,
      });
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
            placeholder="http://localhost:3002"
            disabled={submitting}
            onChange={(event) => setInstanceUrl(event.target.value)}
          />
        </label>
        <label>
          <span>Portal URL (optional)</span>
          <input
            type="url"
            value={portalUrl}
            placeholder="http://localhost:3000"
            disabled={submitting}
            onChange={(event) => setPortalUrl(event.target.value)}
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
  activeCaptureEventIndex,
  activeCaptureMode,
  activeCapturePaused,
  automaticCaptureDiagnostic,
  onSelect,
  onStartCapture,
  onSetActiveCaptureMode,
  onDiscardActiveCapture,
  onCaptureScreenshot,
  onFinishCapture,
  onOpenActiveCapture,
  onChangeInstance,
  onSignOut,
}: {
  auth: AuthResponse["auth"];
  projects: Project[];
  selectedProjectId: string | null;
  activeCaptureSessionId: string | null;
  activeCaptureProjectId: string | null;
  activeCaptureEventIndex: number | null;
  activeCaptureMode: "manual" | "automatic" | null;
  activeCapturePaused: boolean;
  automaticCaptureDiagnostic: ExtensionSettings["automaticCaptureDiagnostic"];
  onSelect: (projectId: string) => Promise<void>;
  onStartCapture: (projectId: string) => Promise<void>;
  onSetActiveCaptureMode: (input: { mode: "manual" | "automatic"; paused: boolean }) => Promise<void>;
  onDiscardActiveCapture: () => Promise<void>;
  onCaptureScreenshot: (input: {
    projectId: string;
    captureSessionId: string;
    eventIndex: number;
  }) => Promise<CaptureEventResponse>;
  onFinishCapture: (input: {
    projectId: string;
    captureSessionId: string;
  }) => Promise<void>;
  onOpenActiveCapture: (input: {
    projectId: string;
    captureSessionId: string;
  }) => Promise<void>;
  onChangeInstance: () => Promise<void>;
  onSignOut: () => Promise<void>;
}) => {
  const [starting, setStarting] = useState(false);
  const [capturingScreenshot, setCapturingScreenshot] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [changingCaptureMode, setChangingCaptureMode] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [portalOpenError, setPortalOpenError] = useState<string | null>(null);
  const [lastCaptureEventIndex, setLastCaptureEventIndex] = useState<number | null>(null);
  const selectedProject = selectedProjectId
    ? projects.find((project) => project.id === selectedProjectId) ?? null
    : null;
  const activeProject = activeCaptureProjectId
    ? projects.find((project) => project.id === activeCaptureProjectId) ?? null
    : null;
  const hasActiveCapture = Boolean(activeCaptureSessionId && activeCaptureProjectId);
  const busy = starting || capturingScreenshot || finishing || openingPortal || changingCaptureMode;
  const resolvedCaptureMode = activeCaptureMode ?? "manual";
  const isAutomaticCapture = resolvedCaptureMode === "automatic";
  const automaticCaptureDiagnosticMessage = automaticCaptureDiagnostic?.status === "failed"
    ? `Automatic click capture failed: ${automaticCaptureDiagnostic.message ?? "Check extension permissions and supported pages."}`
    : null;
  const automaticCaptureSuccessMessage = automaticCaptureDiagnostic?.status === "success" && automaticCaptureDiagnostic.eventIndex
    ? `Automatic capture event recorded: step ${automaticCaptureDiagnostic.eventIndex}`
    : null;

  const heading = hasActiveCapture
    ? "Capture active"
    : selectedProject
      ? "Ready to capture"
      : "Select project";

  const handleStartCapture = async () => {
    if (!selectedProject || busy) {
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

  const handleCaptureScreenshot = async () => {
    if (!activeCaptureProjectId || !activeCaptureSessionId || busy) {
      return;
    }

    setCapturingScreenshot(true);
    setScreenshotError(null);
    setFinishError(null);
    setPortalOpenError(null);
    setLastCaptureEventIndex(null);

    try {
      const nextEventIndex = (activeCaptureEventIndex ?? 0) + 1;
      const result = await onCaptureScreenshot({
        projectId: activeCaptureProjectId,
        captureSessionId: activeCaptureSessionId,
        eventIndex: nextEventIndex,
      });
      setLastCaptureEventIndex(result.capture_event.event_index);
      setCapturingScreenshot(false);
    } catch (error: unknown) {
      setScreenshotError(errorMessage(error, "Could not capture screenshot."));
      setCapturingScreenshot(false);
    }
  };

  const handleFinishCapture = async () => {
    if (!activeCaptureProjectId || !activeCaptureSessionId || busy) {
      return;
    }

    setFinishing(true);
    setScreenshotError(null);
    setFinishError(null);
    setPortalOpenError(null);

    try {
      await onFinishCapture({
        projectId: activeCaptureProjectId,
        captureSessionId: activeCaptureSessionId,
      });
      setFinishing(false);
    } catch (error: unknown) {
      setFinishError(errorMessage(error, "Could not finish capture."));
      setFinishing(false);
    }
  };

  const handleOpenActiveCapture = async () => {
    if (!activeCaptureProjectId || !activeCaptureSessionId || busy) {
      return;
    }

    setOpeningPortal(true);
    setScreenshotError(null);
    setFinishError(null);
    setPortalOpenError(null);

    try {
      await onOpenActiveCapture({
        projectId: activeCaptureProjectId,
        captureSessionId: activeCaptureSessionId,
      });
      setOpeningPortal(false);
    } catch (error: unknown) {
      setPortalOpenError(errorMessage(error, "Could not open capture in portal."));
      setOpeningPortal(false);
    }
  };

  const handleSetAutomaticPaused = async (paused: boolean) => {
    if (busy) {
      return;
    }

    setChangingCaptureMode(true);
    setScreenshotError(null);
    setFinishError(null);
    setPortalOpenError(null);

    try {
      await onSetActiveCaptureMode({
        mode: "automatic",
        paused,
      });
      setChangingCaptureMode(false);
    } catch (error: unknown) {
      setScreenshotError(errorMessage(error, "Could not update automatic capture state."));
      setChangingCaptureMode(false);
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
          <button type="button" className="secondary" disabled={busy} onClick={() => void onChangeInstance()}>
            Change instance
          </button>
          <button type="button" className="secondary" disabled={busy} onClick={() => void onSignOut()}>
            Sign out
          </button>
        </div>
      </div>

      {hasActiveCapture ? (
        <div className="captureState">
          <p className="captureMode">
            {isAutomaticCapture ? "Automatic click capture" : "Manual screenshot capture"}
          </p>
          <p className="captureHelp">
            {isAutomaticCapture
              ? activeCapturePaused
                ? "Automatic click capture is paused. Manual screenshots still work."
                : "Clicks on supported pages create ordered screenshot-backed steps."
              : "Capture one screenshot for each step you want in the guide."}
          </p>
          <p className="captureProject">{activeProject?.name ?? "Project unavailable"}</p>
          <p className="captureSession">Session {activeCaptureSessionId}</p>
          {screenshotError ? <div className="error">{screenshotError}</div> : null}
          {automaticCaptureDiagnosticMessage ? <div className="error">{automaticCaptureDiagnosticMessage}</div> : null}
          {finishError ? <div className="error">{finishError}</div> : null}
          {portalOpenError ? <div className="error">{portalOpenError}</div> : null}
          {automaticCaptureSuccessMessage ? <p className="success">{automaticCaptureSuccessMessage}</p> : null}
          {lastCaptureEventIndex ? <p className="success">Capture event recorded: step {lastCaptureEventIndex}</p> : null}
          <div className="actions">
            {isAutomaticCapture ? (
              <button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={() => void handleSetAutomaticPaused(!activeCapturePaused)}
              >
                {activeCapturePaused ? "Resume automatic capture" : "Pause automatic capture"}
              </button>
            ) : null}
            <button type="button" disabled={busy} onClick={() => void handleCaptureScreenshot()}>
              {capturingScreenshot ? "Capturing..." : "Capture screenshot"}
            </button>
            <button type="button" className="secondary" disabled={busy} onClick={() => void handleOpenActiveCapture()}>
              {openingPortal ? "Opening..." : "Open in portal"}
            </button>
            <button type="button" disabled={busy} onClick={() => void handleFinishCapture()}>
              {finishing ? "Finishing..." : "Finish capture"}
            </button>
            <button type="button" className="secondary" disabled={busy} onClick={() => void onDiscardActiveCapture()}>
              Discard local capture state
            </button>
          </div>
        </div>
      ) : null}

      {!hasActiveCapture && selectedProject ? (
        <div className="captureState">
          <p className="captureMode">Automatic click capture</p>
          <p className="captureHelp">Clicks on supported pages create ordered screenshot-backed steps.</p>
          <p className="captureHelp">Manual screenshots remain available after capture starts.</p>
          <p className="captureProject">{selectedProject.name}</p>
          {startError ? <div className="error">{startError}</div> : null}
          {finishError ? <div className="error">{finishError}</div> : null}
          <button type="button" disabled={busy} onClick={() => void handleStartCapture()}>
            {starting ? "Starting..." : "Start automatic capture"}
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
              disabled={busy}
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
