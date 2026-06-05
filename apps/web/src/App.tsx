import { CaptureSessionDetailPage } from "./features/capture-session/CaptureSessionDetailPage";
import { ProjectCaptureSessionListPage } from "./features/capture-session/ProjectCaptureSessionListPage";
import { LoginPage } from "./features/auth/LoginPage";
import { GuideEditorPage } from "./features/guide/GuideEditorPage";
import { ProjectGuideListPage } from "./features/guide/ProjectGuideListPage";
import { ProjectListPage } from "./features/project/ProjectListPage";
import { ProjectWorkspacePage } from "./features/project/ProjectWorkspacePage";
import { parsePortalRoute } from "./lib/routes";
import styles from "./App.module.css";

export default function App() {
  const route = parsePortalRoute(window.location.pathname);
  const currentPath = `${window.location.pathname}${window.location.search}`;

  if (route.type === "login") {
    return (
      <LoginPage
        nextPath={new URLSearchParams(window.location.search).get("next") ?? "/projects"}
      />
    );
  }

  if (route.type === "project_list") {
    return (
      <ProjectListPage currentPath={currentPath} />
    );
  }

  if (route.type === "project_workspace") {
    return (
      <ProjectWorkspacePage
        projectId={route.projectId}
        currentPath={currentPath}
      />
    );
  }

  if (route.type === "capture_session_detail") {
    return (
      <CaptureSessionDetailPage
        projectId={route.projectId}
        captureSessionId={route.captureSessionId}
        currentPath={currentPath}
      />
    );
  }

  if (route.type === "project_capture_session_list") {
    return (
      <ProjectCaptureSessionListPage
        projectId={route.projectId}
        currentPath={currentPath}
      />
    );
  }

  if (route.type === "guide_detail") {
    return (
      <GuideEditorPage
        projectId={route.projectId}
        guideId={route.guideId}
        currentPath={currentPath}
      />
    );
  }

  if (route.type === "project_guide_list") {
    return (
      <ProjectGuideListPage
        projectId={route.projectId}
        currentPath={currentPath}
      />
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.brand}>Demo Composer</div>
      </header>
      <main className={styles.main}>
        <section className={styles.emptyState}>
          <h1 className={styles.title}>Demo Composer portal</h1>
          <p>Open the project list, a project workspace, capture session list, capture session, guide list, or guide link to continue.</p>
        </section>
      </main>
    </div>
  );
}
