import { type FormEvent, useEffect, useRef, useState } from "react";
import {
  ApiClientError,
  createProjectCaptureSession,
  listProjectCaptureSessions,
  type CaptureSessionCreateResponse,
  type ProjectCaptureSessionListResponse,
} from "../../lib/api";
import { currentBrowserPath, signInUrl } from "../auth/navigation";
import { PortalTopbar } from "../portal/PortalTopbar";
import type { CaptureSession, CreateCaptureSessionInput } from "./types";
import styles from "./ProjectCaptureSessionListPage.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; captureSessions: CaptureSession[] }
  | { status: "unauthenticated" }
  | { status: "not_found" }
  | { status: "error" };

type ProjectCaptureSessionListPageProps = {
  projectId: string;
  loadCaptureSessions?: (projectId: string) => Promise<ProjectCaptureSessionListResponse>;
  createCaptureSession?: (
    projectId: string,
    input: CreateCaptureSessionInput
  ) => Promise<CaptureSessionCreateResponse>;
  currentPath?: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
};

type CreateCaptureSessionFormState = {
  name: string;
  start_url: string;
  description: string;
};

const emptyCreateCaptureSessionForm = (): CreateCaptureSessionFormState => ({
  name: "",
  start_url: "",
  description: "",
});

const loadStateFromError = (error: unknown): LoadState => {
  if (error instanceof ApiClientError) {
    if (error.kind === "unauthenticated") {
      return { status: "unauthenticated" };
    }

    if (error.kind === "not_found") {
      return { status: "not_found" };
    }
  }

  return { status: "error" };
};

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const captureSessionUrl = (projectId: string, captureSessionId: string) => (
  `/projects/${encodeURIComponent(projectId)}/capture-sessions/${encodeURIComponent(captureSessionId)}`
);

const optionalCaptureSessionField = (value: string) => {
  const trimmed = value.trim();

  return trimmed || null;
};

const createCaptureSessionErrorMessage = (error: unknown) => {
  if (error instanceof ApiClientError) {
    if (error.kind === "unauthenticated") {
      return "Sign in to create a capture session.";
    }

    if (error.type === "project_not_found") {
      return "Project was not found.";
    }

    if (error.type === "invalid_capture_session") {
      return "Capture session input is invalid.";
    }
  }

  return "Could not create capture session.";
};

const openCaptureSession = (
  projectId: string,
  captureSessionId: string,
  navigate?: (path: string) => void
) => {
  const path = captureSessionUrl(projectId, captureSessionId);

  if (navigate) {
    navigate(path);
    return;
  }

  window.location.assign(path);
};

const startUrlLabel = (value: string | null) => {
  if (!value) {
    return "No start URL";
  }

  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
};

const browserLabel = (session: CaptureSession) => (
  [session.browser_name, session.browser_version].filter(Boolean).join(" ")
);

const viewportLabel = (session: CaptureSession) => (
  session.viewport_width && session.viewport_height
    ? `${session.viewport_width} x ${session.viewport_height}`
    : null
);

export const ProjectCaptureSessionListPage = ({
  projectId,
  loadCaptureSessions = listProjectCaptureSessions,
  createCaptureSession: createCaptureSessionAction = createProjectCaptureSession,
  currentPath = currentBrowserPath(),
  performLogout,
  navigate,
}: ProjectCaptureSessionListPageProps) => {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<CreateCaptureSessionFormState>(emptyCreateCaptureSessionForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const createNameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    loadCaptureSessions(projectId)
      .then((response) => {
        if (active) {
          setState({ status: "loaded", captureSessions: response.capture_sessions });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setState(loadStateFromError(error));
        }
      });

    return () => {
      active = false;
    };
  }, [projectId, loadCaptureSessions, reloadKey]);

  useEffect(() => {
    if (showCreateForm) {
      createNameInputRef.current?.focus();
    }
  }, [showCreateForm]);

  const updateCreateField = (field: keyof CreateCaptureSessionFormState, value: string) => {
    setCreateForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const openCreateForm = () => {
    setCreateForm(emptyCreateCaptureSessionForm());
    setShowCreateForm(true);
    setCreateError(null);
  };

  const closeCreateForm = () => {
    setCreateForm(emptyCreateCaptureSessionForm());
    setShowCreateForm(false);
    setCreateError(null);
  };

  const submitCreateCaptureSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isCreating) {
      return;
    }

    const name = createForm.name.trim();

    if (!name) {
      setCreateError("Capture session name is required.");
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const response = await createCaptureSessionAction(projectId, {
        name,
        description: optionalCaptureSessionField(createForm.description),
        source_type: "manual",
        start_url: optionalCaptureSessionField(createForm.start_url),
      });
      openCaptureSession(projectId, response.capture_session.id, navigate);
    } catch (error: unknown) {
      setCreateError(createCaptureSessionErrorMessage(error));
    } finally {
      setIsCreating(false);
    }
  };

  if (state.status === "loading") {
    return (
      <PortalShell projectId={projectId} performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>Loading capture sessions...</div>
      </PortalShell>
    );
  }

  if (state.status === "unauthenticated") {
    return (
      <PortalShell projectId={projectId} performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>
          <div>Sign in to view capture sessions.</div>
          <a className={styles.stateLink} href={signInUrl(currentPath)}>Sign in</a>
        </div>
      </PortalShell>
    );
  }

  if (state.status === "not_found") {
    return (
      <PortalShell projectId={projectId} performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>Project was not found.</div>
      </PortalShell>
    );
  }

  if (state.status === "error") {
    return (
      <PortalShell projectId={projectId} performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>
          <div>Could not load capture sessions.</div>
          <button className={styles.secondaryButton} type="button" onClick={() => setReloadKey((key) => key + 1)}>
            Retry
          </button>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell projectId={projectId} performLogout={performLogout} navigate={navigate}>
      <section className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Project</div>
          <h1 className={styles.title}>Capture sessions</h1>
          <p className={styles.description}>{projectId}</p>
        </div>
        <button className={styles.primaryButton} type="button" onClick={openCreateForm}>
          New Capture Session
        </button>
      </section>

      {showCreateForm ? (
        <section className={styles.createPanel} aria-labelledby="create-capture-session-heading">
          <h2 className={styles.formTitle} id="create-capture-session-heading">Create capture session</h2>
          <form className={styles.form} onSubmit={submitCreateCaptureSession}>
            {createError ? <div className={styles.formError}>{createError}</div> : null}
            <label className={styles.field}>
              <span>Name</span>
              <input
                ref={createNameInputRef}
                value={createForm.name}
                onChange={(event) => updateCreateField("name", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span>Start URL</span>
              <input
                value={createForm.start_url}
                onChange={(event) => updateCreateField("start_url", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span>Description</span>
              <textarea
                rows={4}
                value={createForm.description}
                onChange={(event) => updateCreateField("description", event.target.value)}
              />
            </label>
            <div className={styles.formActions}>
              <button className={styles.primaryButton} type="submit" disabled={isCreating}>
                {isCreating ? "Creating Capture Session..." : "Create Capture Session"}
              </button>
              <button className={styles.secondaryButton} type="button" onClick={closeCreateForm} disabled={isCreating}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className={styles.content} aria-labelledby="capture-sessions-heading">
        <h2 className={styles.sectionTitle} id="capture-sessions-heading">Project capture sessions</h2>
        {state.captureSessions.length === 0 ? (
          <div className={styles.empty}>No capture sessions yet.</div>
        ) : (
          <div className={styles.list}>
            {state.captureSessions.map((captureSession) => (
              <CaptureSessionRow key={captureSession.id} captureSession={captureSession} projectId={projectId} />
            ))}
          </div>
        )}
      </section>
    </PortalShell>
  );
};

const PortalShell = ({
  children,
  projectId,
  performLogout,
  navigate,
}: {
  children: React.ReactNode;
  projectId: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
}) => (
  <div className={styles.page}>
    <PortalTopbar context={`${projectId} / capture sessions`} performLogout={performLogout} navigate={navigate} />
    <main className={styles.main}>{children}</main>
  </div>
);

const CaptureSessionRow = ({
  captureSession,
  projectId,
}: {
  captureSession: CaptureSession;
  projectId: string;
}) => {
  const browser = browserLabel(captureSession);
  const viewport = viewportLabel(captureSession);

  return (
    <article className={styles.captureSession}>
      <div className={styles.captureSessionBody}>
        <div className={styles.captureSessionHeader}>
          <h3 className={styles.captureSessionTitle}>{captureSession.name}</h3>
          <span className={styles.badge}>{captureSession.status}</span>
          <span className={styles.badge}>{captureSession.source_type}</span>
        </div>
        {captureSession.description ? <p className={styles.captureSessionDescription}>{captureSession.description}</p> : null}
        <div className={styles.meta}>
          <span>{startUrlLabel(captureSession.start_url)}</span>
          <span>Started {formatDateTime(captureSession.started_at)}</span>
          <span>Completed {formatDateTime(captureSession.completed_at)}</span>
          {captureSession.canceled_at ? <span>Canceled {formatDateTime(captureSession.canceled_at)}</span> : null}
          <span>Updated {formatDateTime(captureSession.updated_at)}</span>
          {browser ? <span>{browser}</span> : null}
          {captureSession.operating_system ? <span>{captureSession.operating_system}</span> : null}
          {viewport ? <span>{viewport}</span> : null}
        </div>
      </div>
      <a className={styles.openLink} href={captureSessionUrl(projectId, captureSession.id)}>
        Open capture session {captureSession.name}
      </a>
    </article>
  );
};
