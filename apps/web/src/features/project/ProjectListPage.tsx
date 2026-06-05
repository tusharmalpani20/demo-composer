import { useEffect, useState } from "react";
import { ApiClientError, listProjects, type ProjectListResponse } from "../../lib/api";
import { currentBrowserPath, signInUrl } from "../auth/navigation";
import { PortalTopbar } from "../portal/PortalTopbar";
import type { Project } from "./types";
import styles from "./ProjectListPage.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; projects: Project[] }
  | { status: "unauthenticated" }
  | { status: "error" };

type ProjectListPageProps = {
  loadProjects?: () => Promise<ProjectListResponse>;
  currentPath?: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
};

const loadStateFromError = (error: unknown): LoadState => {
  if (error instanceof ApiClientError && error.kind === "unauthenticated") {
    return { status: "unauthenticated" };
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

const projectUrl = (projectId: string) => `/projects/${encodeURIComponent(projectId)}`;

export const ProjectListPage = ({
  loadProjects = listProjects,
  currentPath = currentBrowserPath(),
  performLogout,
  navigate,
}: ProjectListPageProps) => {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    loadProjects()
      .then((response) => {
        if (active) {
          setState({ status: "loaded", projects: response.projects });
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
  }, [loadProjects, reloadKey]);

  if (state.status === "loading") {
    return (
      <PortalShell performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>Loading projects...</div>
      </PortalShell>
    );
  }

  if (state.status === "unauthenticated") {
    return (
      <PortalShell performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>
          <div>Sign in to view projects.</div>
          <a className={styles.stateLink} href={signInUrl(currentPath)}>Sign in</a>
        </div>
      </PortalShell>
    );
  }

  if (state.status === "error") {
    return (
      <PortalShell performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>
          <div>Could not load projects.</div>
          <button className={styles.secondaryButton} type="button" onClick={() => setReloadKey((key) => key + 1)}>
            Retry
          </button>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell performLogout={performLogout} navigate={navigate}>
      <section className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Portal home</div>
          <h1 className={styles.title}>Projects</h1>
        </div>
      </section>

      <section className={styles.content} aria-labelledby="projects-heading">
        <h2 className={styles.sectionTitle} id="projects-heading">All projects</h2>
        {state.projects.length === 0 ? (
          <div className={styles.empty}>No projects yet.</div>
        ) : (
          <div className={styles.projects}>
            {state.projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>
    </PortalShell>
  );
};

const PortalShell = ({
  children,
  performLogout,
  navigate,
}: {
  children: React.ReactNode;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
}) => (
  <div className={styles.page}>
    <PortalTopbar context="Projects" performLogout={performLogout} navigate={navigate} />
    <main className={styles.main}>{children}</main>
  </div>
);

const ProjectCard = ({ project }: { project: Project }) => (
  <article className={styles.project}>
    <div className={styles.projectBody}>
      <div className={styles.titleRow}>
        <h3 className={styles.projectTitle}>{project.name}</h3>
        <span className={styles.badge}>{project.status}</span>
      </div>
      {project.description ? (
        <p className={styles.description}>{project.description}</p>
      ) : null}
      <div className={styles.meta}>
        {project.slug ? <span>{project.slug}</span> : null}
        <span>Updated {formatDateTime(project.updated_at)}</span>
        <span>Created {formatDateTime(project.created_at)}</span>
      </div>
    </div>
    <a className={styles.openLink} href={projectUrl(project.id)}>
      Open project {project.name}
    </a>
  </article>
);
