import { CaptureSessionDetailPage } from "./features/capture-session/CaptureSessionDetailPage";
import { GuideEditorPage } from "./features/guide/GuideEditorPage";
import { parsePortalRoute } from "./lib/routes";
import styles from "./App.module.css";

export default function App() {
  const route = parsePortalRoute(window.location.pathname);

  if (route.type === "capture_session_detail") {
    return (
      <CaptureSessionDetailPage
        projectId={route.projectId}
        captureSessionId={route.captureSessionId}
      />
    );
  }

  if (route.type === "guide_detail") {
    return (
      <GuideEditorPage
        projectId={route.projectId}
        guideId={route.guideId}
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
          <h1 className={styles.title}>Capture session portal</h1>
          <p>Open a capture session or guide link to continue.</p>
        </section>
      </main>
    </div>
  );
}
