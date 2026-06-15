import { useEffect, useState } from "react";
import {
  ApiClientError,
  listProjectInteractiveDemos,
  type ProjectInteractiveDemoListResponse,
} from "../../lib/api";
import { currentBrowserPath, signInUrl } from "../auth/navigation";
import { PortalTopbar } from "../portal/PortalTopbar";
import type { InteractiveDemo } from "./types";
import styles from "./ProjectInteractiveDemoListPage.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; demos: InteractiveDemo[] }
  | { status: "unauthenticated" }
  | { status: "not_found" }
  | { status: "error" };

export type ProjectInteractiveDemoListPageProps = {
  projectId: string;
  loadDemos?: (projectId: string) => Promise<ProjectInteractiveDemoListResponse>;
  currentPath?: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
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

const formatDateTime = (value: string) => new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
}).format(new Date(value));

const demoUrl = (projectId: string, demoId: string) => (
  `/projects/${encodeURIComponent(projectId)}/interactive-demos/${encodeURIComponent(demoId)}`
);

const captureSessionsUrl = (projectId: string) => (
  `/projects/${encodeURIComponent(projectId)}/capture-sessions`
);

export const ProjectInteractiveDemoListPage = ({
  projectId,
  loadDemos = listProjectInteractiveDemos,
  currentPath = currentBrowserPath(),
  performLogout,
  navigate,
}: ProjectInteractiveDemoListPageProps) => {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    loadDemos(projectId)
      .then((response) => {
        if (active) {
          setState({ status: "loaded", demos: response.interactive_demos });
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
  }, [projectId, loadDemos, reloadKey]);

  if (state.status === "loading") {
    return (
      <PortalShell projectId={projectId} performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>Loading interactive demos...</div>
      </PortalShell>
    );
  }

  if (state.status === "unauthenticated") {
    return (
      <PortalShell projectId={projectId} performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>
          <div>Sign in to view interactive demos.</div>
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
          <div>Could not load interactive demos.</div>
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
          <h1 className={styles.title}>Interactive demos</h1>
          <p className={styles.description}>{projectId}</p>
        </div>
      </section>

      <section className={styles.content} aria-labelledby="interactive-demos-heading">
        <h2 className={styles.sectionTitle} id="interactive-demos-heading">Project interactive demos</h2>
        {state.demos.length === 0 ? (
          <div className={styles.empty}>
            <div>No interactive demos yet.</div>
            <a className={styles.stateLink} href={captureSessionsUrl(projectId)}>Open capture sessions</a>
          </div>
        ) : (
          <div className={styles.list}>
            {state.demos.map((demo) => (
              <DemoRow key={demo.id} demo={demo} projectId={projectId} />
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
    <PortalTopbar context={`${projectId} / interactive demos`} performLogout={performLogout} navigate={navigate} />
    <main className={styles.main}>{children}</main>
  </div>
);

const DemoRow = ({
  demo,
  projectId,
}: {
  demo: InteractiveDemo;
  projectId: string;
}) => (
  <article className={styles.demo}>
    <div className={styles.demoBody}>
      <div className={styles.demoHeader}>
        <h3 className={styles.demoTitle}>{demo.title}</h3>
        <span className={styles.badge}>{demo.status}</span>
      </div>
      {demo.description ? <p className={styles.demoDescription}>{demo.description}</p> : null}
      <div className={styles.meta}>
        <span>{demo.source_capture_session_id ? `Source capture: ${demo.source_capture_session_id}` : "No source capture"}</span>
        <span>Updated {formatDateTime(demo.updated_at)}</span>
        <span>Created {formatDateTime(demo.created_at)}</span>
      </div>
    </div>
    <a className={styles.openLink} href={demoUrl(projectId, demo.id)}>
      Open demo {demo.title}
    </a>
  </article>
);
