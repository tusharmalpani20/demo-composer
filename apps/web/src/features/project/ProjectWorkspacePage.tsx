import { useEffect, useState } from "react";
import { ApiClientError, getProject, type ProjectDetailResponse } from "../../lib/api";
import type { Project } from "./types";
import styles from "./ProjectWorkspacePage.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; project: Project }
  | { status: "unauthenticated" }
  | { status: "not_found" }
  | { status: "error" };

type ProjectWorkspacePageProps = {
  projectId: string;
  loadProject?: (projectId: string) => Promise<ProjectDetailResponse>;
};

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

const formatDateTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const captureSessionsUrl = (projectId: string) => (
  `/projects/${encodeURIComponent(projectId)}/capture-sessions`
);

const guidesUrl = (projectId: string) => (
  `/projects/${encodeURIComponent(projectId)}/guides`
);

export const ProjectWorkspacePage = ({
  projectId,
  loadProject = getProject,
}: ProjectWorkspacePageProps) => {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    loadProject(projectId)
      .then((response) => {
        if (active) {
          setState({ status: "loaded", project: response.project });
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
  }, [projectId, loadProject, reloadKey]);

  if (state.status === "loading") {
    return (
      <PortalShell projectId={projectId}>
        <div className={styles.state}>Loading project...</div>
      </PortalShell>
    );
  }

  if (state.status === "unauthenticated") {
    return (
      <PortalShell projectId={projectId}>
        <div className={styles.state}>Sign in to view this project.</div>
      </PortalShell>
    );
  }

  if (state.status === "not_found") {
    return (
      <PortalShell projectId={projectId}>
        <div className={styles.state}>Project was not found.</div>
      </PortalShell>
    );
  }

  if (state.status === "error") {
    return (
      <PortalShell projectId={projectId}>
        <div className={styles.state}>
          <div>Could not load project.</div>
          <button className={styles.secondaryButton} type="button" onClick={() => setReloadKey((key) => key + 1)}>
            Retry
          </button>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell projectId={projectId}>
      <section className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Project workspace</div>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{state.project.name}</h1>
            <span className={styles.badge}>{state.project.status}</span>
          </div>
          {state.project.description ? (
            <p className={styles.description}>{state.project.description}</p>
          ) : null}
          <div className={styles.meta}>
            {state.project.slug ? <span>{state.project.slug}</span> : null}
            <span>Updated {formatDateTime(state.project.updated_at)}</span>
            <span>Created {formatDateTime(state.project.created_at)}</span>
          </div>
        </div>
      </section>

      <section className={styles.content} aria-labelledby="workspace-heading">
        <h2 className={styles.sectionTitle} id="workspace-heading">Workspace</h2>
        <div className={styles.actions}>
          <WorkspaceAction
            title="Capture sessions"
            description="Open source captures for this project."
            href={captureSessionsUrl(projectId)}
            linkLabel="Open capture sessions"
          />
          <WorkspaceAction
            title="Guides"
            description="Open prepared docs and demos for this project."
            href={guidesUrl(projectId)}
            linkLabel="Open guides"
          />
        </div>
      </section>
    </PortalShell>
  );
};

const PortalShell = ({
  children,
  projectId,
}: {
  children: React.ReactNode;
  projectId: string;
}) => (
  <div className={styles.page}>
    <header className={styles.topbar}>
      <div className={styles.brand}>Demo Composer</div>
      <div className={styles.context}>{projectId}</div>
    </header>
    <main className={styles.main}>{children}</main>
  </div>
);

const WorkspaceAction = ({
  title,
  description,
  href,
  linkLabel,
}: {
  title: string;
  description: string;
  href: string;
  linkLabel: string;
}) => (
  <article className={styles.action}>
    <div className={styles.actionBody}>
      <h3 className={styles.actionTitle}>{title}</h3>
      <p className={styles.actionDescription}>{description}</p>
    </div>
    <a className={styles.openLink} href={href}>
      {linkLabel}
    </a>
  </article>
);
