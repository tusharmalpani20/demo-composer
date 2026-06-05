import { useEffect, useState } from "react";
import { ApiClientError, listProjectGuides, type ProjectGuideListResponse } from "../../lib/api";
import type { Guide } from "./types";
import styles from "./ProjectGuideListPage.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; guides: Guide[] }
  | { status: "unauthenticated" }
  | { status: "not_found" }
  | { status: "error" };

type ProjectGuideListPageProps = {
  projectId: string;
  loadGuides?: (projectId: string) => Promise<ProjectGuideListResponse>;
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

const guideUrl = (projectId: string, guideId: string) => (
  `/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}`
);

export const ProjectGuideListPage = ({
  projectId,
  loadGuides = listProjectGuides,
}: ProjectGuideListPageProps) => {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    loadGuides(projectId)
      .then((response) => {
        if (active) {
          setState({ status: "loaded", guides: response.guides });
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
  }, [projectId, loadGuides, reloadKey]);

  if (state.status === "loading") {
    return (
      <PortalShell projectId={projectId}>
        <div className={styles.state}>Loading guides...</div>
      </PortalShell>
    );
  }

  if (state.status === "unauthenticated") {
    return (
      <PortalShell projectId={projectId}>
        <div className={styles.state}>Sign in to view guides.</div>
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
          <div>Could not load guides.</div>
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
          <div className={styles.eyebrow}>Project</div>
          <h1 className={styles.title}>Guides</h1>
          <p className={styles.description}>{projectId}</p>
        </div>
      </section>

      <section className={styles.content} aria-labelledby="guides-heading">
        <h2 className={styles.sectionTitle} id="guides-heading">Project guides</h2>
        {state.guides.length === 0 ? (
          <div className={styles.empty}>No guides yet.</div>
        ) : (
          <div className={styles.list}>
            {state.guides.map((guide) => (
              <GuideRow key={guide.id} guide={guide} projectId={projectId} />
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
}: {
  children: React.ReactNode;
  projectId: string;
}) => (
  <div className={styles.page}>
    <header className={styles.topbar}>
      <div className={styles.brand}>Demo Composer</div>
      <div className={styles.context}>{projectId} / guides</div>
    </header>
    <main className={styles.main}>{children}</main>
  </div>
);

const GuideRow = ({ guide, projectId }: { guide: Guide; projectId: string }) => (
  <article className={styles.guide}>
    <div className={styles.guideBody}>
      <div className={styles.guideHeader}>
        <h3 className={styles.guideTitle}>{guide.title}</h3>
        <span className={styles.badge}>{guide.status}</span>
      </div>
      {guide.description ? <p className={styles.guideDescription}>{guide.description}</p> : null}
      <div className={styles.meta}>
        <span>{guide.source_capture_session_id ? `Source capture: ${guide.source_capture_session_id}` : "No source capture"}</span>
        <span>Updated {formatDateTime(guide.updated_at)}</span>
        <span>Created {formatDateTime(guide.created_at)}</span>
      </div>
    </div>
    <a className={styles.openLink} href={guideUrl(projectId, guide.id)}>
      Open guide {guide.title}
    </a>
  </article>
);
