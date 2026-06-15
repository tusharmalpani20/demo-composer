import { useEffect, useMemo, useState } from "react";
import {
  ApiClientError,
  deleteInteractiveDemoScene,
  getInteractiveDemo,
  listInteractiveDemoScenes,
  reorderInteractiveDemoScenes,
  resolveApiAssetUrl,
  updateInteractiveDemo,
  updateInteractiveDemoScene,
  type InteractiveDemoDetailResponse,
  type InteractiveDemoSceneListResponse,
  type InteractiveDemoSceneReorderResponse,
  type InteractiveDemoSceneUpdateResponse,
} from "../../lib/api";
import { currentBrowserPath, signInUrl } from "../auth/navigation";
import { PortalTopbar } from "../portal/PortalTopbar";
import type { DemoScene, InteractiveDemo, UpdateDemoSceneInput, UpdateInteractiveDemoInput } from "./types";
import styles from "./InteractiveDemoEditorPage.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; demo: InteractiveDemo; scenes: DemoScene[] }
  | { status: "unauthenticated" }
  | { status: "not_found" }
  | { status: "error" };

type DemoDraft = {
  title: string;
  description: string;
  status: InteractiveDemo["status"];
};

type SceneDraft = {
  title: string;
  description: string;
};

export type InteractiveDemoEditorPageProps = {
  projectId: string;
  interactiveDemoId: string;
  loadDemo?: (projectId: string, interactiveDemoId: string) => Promise<InteractiveDemoDetailResponse>;
  loadScenes?: (projectId: string, interactiveDemoId: string) => Promise<InteractiveDemoSceneListResponse>;
  saveDemo?: (
    projectId: string,
    interactiveDemoId: string,
    input: UpdateInteractiveDemoInput
  ) => Promise<InteractiveDemoDetailResponse>;
  saveScene?: (
    projectId: string,
    interactiveDemoId: string,
    sceneId: string,
    input: UpdateDemoSceneInput
  ) => Promise<InteractiveDemoSceneUpdateResponse>;
  reorderScenes?: (
    projectId: string,
    interactiveDemoId: string,
    sceneIds: string[]
  ) => Promise<InteractiveDemoSceneReorderResponse>;
  deleteScene?: (projectId: string, interactiveDemoId: string, sceneId: string) => Promise<void>;
  resolveAssetUrl?: (fileUrl: string) => string;
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

const sortedScenes = (scenes: DemoScene[]) => (
  [...scenes].sort((left, right) => left.scene_index - right.scene_index)
);

const demoDraftFromDemo = (demo: InteractiveDemo): DemoDraft => ({
  title: demo.title,
  description: demo.description ?? "",
  status: demo.status,
});

const sceneDraftsFromScenes = (scenes: DemoScene[]) => scenes.reduce<Record<string, SceneDraft>>((drafts, scene) => {
  drafts[scene.id] = {
    title: scene.title ?? "",
    description: scene.description ?? "",
  };
  return drafts;
}, {});

const sourceCaptureUrl = (projectId: string, captureSessionId: string) => (
  `/projects/${encodeURIComponent(projectId)}/capture-sessions/${encodeURIComponent(captureSessionId)}`
);

const sceneAssetFileUrl = (projectId: string, scene: DemoScene) => {
  if (!scene.source_capture_session_id || !scene.background_capture_asset_id) {
    return null;
  }

  return `/api/v1/projects/${encodeURIComponent(projectId)}/capture-sessions/${encodeURIComponent(scene.source_capture_session_id)}/assets/${encodeURIComponent(scene.background_capture_asset_id)}/file`;
};

export const InteractiveDemoEditorPage = ({
  projectId,
  interactiveDemoId,
  loadDemo = getInteractiveDemo,
  loadScenes = listInteractiveDemoScenes,
  saveDemo = updateInteractiveDemo,
  saveScene = updateInteractiveDemoScene,
  reorderScenes = reorderInteractiveDemoScenes,
  deleteScene = deleteInteractiveDemoScene,
  resolveAssetUrl = resolveApiAssetUrl,
  currentPath = currentBrowserPath(),
  performLogout,
  navigate,
}: InteractiveDemoEditorPageProps) => {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    Promise.all([
      loadDemo(projectId, interactiveDemoId),
      loadScenes(projectId, interactiveDemoId),
    ])
      .then(([demoResponse, sceneResponse]) => {
        if (active) {
          setState({
            status: "loaded",
            demo: demoResponse.interactive_demo,
            scenes: sortedScenes(sceneResponse.demo_scenes),
          });
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
  }, [projectId, interactiveDemoId, loadDemo, loadScenes, reloadKey]);

  if (state.status === "loading") {
    return (
      <PortalShell projectId={projectId} interactiveDemoId={interactiveDemoId} performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>Loading interactive demo...</div>
      </PortalShell>
    );
  }

  if (state.status === "unauthenticated") {
    return (
      <PortalShell projectId={projectId} interactiveDemoId={interactiveDemoId} performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>
          <div>Sign in to view this interactive demo.</div>
          <a className={styles.stateLink} href={signInUrl(currentPath)}>Sign in</a>
        </div>
      </PortalShell>
    );
  }

  if (state.status === "not_found") {
    return (
      <PortalShell projectId={projectId} interactiveDemoId={interactiveDemoId} performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>Interactive demo was not found.</div>
      </PortalShell>
    );
  }

  if (state.status === "error") {
    return (
      <PortalShell projectId={projectId} interactiveDemoId={interactiveDemoId} performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>
          <div>Could not load interactive demo.</div>
          <button className={styles.secondaryButton} type="button" onClick={() => setReloadKey((key) => key + 1)}>
            Retry
          </button>
        </div>
      </PortalShell>
    );
  }

  return (
    <InteractiveDemoEditorLoaded
      projectId={projectId}
      interactiveDemoId={interactiveDemoId}
      demo={state.demo}
      scenes={state.scenes}
      saveDemo={saveDemo}
      saveScene={saveScene}
      reorderScenes={reorderScenes}
      deleteScene={deleteScene}
      resolveAssetUrl={resolveAssetUrl}
      setLoadedState={(next) => setState({ status: "loaded", ...next })}
      performLogout={performLogout}
      navigate={navigate}
    />
  );
};

const PortalShell = ({
  children,
  projectId,
  interactiveDemoId,
  performLogout,
  navigate,
}: {
  children: React.ReactNode;
  projectId: string;
  interactiveDemoId: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
}) => (
  <div className={styles.page}>
    <PortalTopbar context={`${projectId} / interactive demos / ${interactiveDemoId}`} performLogout={performLogout} navigate={navigate} />
    <main className={styles.main}>{children}</main>
  </div>
);

const InteractiveDemoEditorLoaded = ({
  projectId,
  interactiveDemoId,
  demo,
  scenes,
  saveDemo,
  saveScene,
  reorderScenes,
  deleteScene,
  resolveAssetUrl,
  setLoadedState,
  performLogout,
  navigate,
}: {
  projectId: string;
  interactiveDemoId: string;
  demo: InteractiveDemo;
  scenes: DemoScene[];
  saveDemo: NonNullable<InteractiveDemoEditorPageProps["saveDemo"]>;
  saveScene: NonNullable<InteractiveDemoEditorPageProps["saveScene"]>;
  reorderScenes: NonNullable<InteractiveDemoEditorPageProps["reorderScenes"]>;
  deleteScene: NonNullable<InteractiveDemoEditorPageProps["deleteScene"]>;
  resolveAssetUrl: (fileUrl: string) => string;
  setLoadedState: (state: { demo: InteractiveDemo; scenes: DemoScene[] }) => void;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
}) => {
  const orderedScenes = useMemo(() => sortedScenes(scenes), [scenes]);
  const [demoDraft, setDemoDraft] = useState<DemoDraft>(() => demoDraftFromDemo(demo));
  const [sceneDrafts, setSceneDrafts] = useState<Record<string, SceneDraft>>(() => sceneDraftsFromScenes(orderedScenes));
  const [message, setMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const updateDemoDraft = (field: keyof DemoDraft, value: string) => {
    setDemoDraft((draft) => ({
      ...draft,
      [field]: field === "status" && value === "archived" ? "archived" : value,
    }));
    setMessage(null);
  };

  const updateSceneDraft = (sceneId: string, field: keyof SceneDraft, value: string) => {
    setSceneDrafts((drafts) => ({
      ...drafts,
      [sceneId]: {
        ...(drafts[sceneId] ?? { title: "", description: "" }),
        [field]: value,
      },
    }));
    setMessage(null);
  };

  const handleSaveDemo = async () => {
    setPendingAction("demo");
    setMessage(null);

    try {
      const response = await saveDemo(projectId, interactiveDemoId, {
        title: demoDraft.title.trim(),
        description: demoDraft.description.trim() || null,
        status: demoDraft.status,
      });
      setLoadedState({ demo: response.interactive_demo, scenes: orderedScenes });
      setDemoDraft(demoDraftFromDemo(response.interactive_demo));
      setMessage("Demo saved.");
    } catch {
      setMessage("Could not save demo.");
    } finally {
      setPendingAction(null);
    }
  };

  const handleSaveScene = async (scene: DemoScene) => {
    const draft = sceneDrafts[scene.id] ?? { title: "", description: "" };
    setPendingAction(`scene:${scene.id}`);
    setMessage(null);

    try {
      const response = await saveScene(projectId, interactiveDemoId, scene.id, {
        title: draft.title.trim() || null,
        description: draft.description.trim() || null,
      });
      const nextScenes = orderedScenes.map((candidate) => (
        candidate.id === response.demo_scene.id ? response.demo_scene : candidate
      ));
      setLoadedState({ demo, scenes: nextScenes });
      setSceneDrafts(sceneDraftsFromScenes(nextScenes));
      setMessage("Scene saved.");
    } catch {
      setMessage("Could not save scene.");
    } finally {
      setPendingAction(null);
    }
  };

  const moveScene = async (fromIndex: number, direction: -1 | 1) => {
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= orderedScenes.length) {
      return;
    }

    const sceneIds = orderedScenes.map((scene) => scene.id);
    const movingSceneId = sceneIds[fromIndex];
    const targetSceneId = sceneIds[toIndex];

    if (!movingSceneId || !targetSceneId) {
      return;
    }

    sceneIds[fromIndex] = targetSceneId;
    sceneIds[toIndex] = movingSceneId;
    setPendingAction("reorder");
    setMessage(null);

    try {
      const response = await reorderScenes(projectId, interactiveDemoId, sceneIds);
      const nextScenes = sortedScenes(response.demo_scenes);
      setLoadedState({ demo, scenes: nextScenes });
      setSceneDrafts(sceneDraftsFromScenes(nextScenes));
    } catch {
      setMessage("Could not reorder scenes.");
    } finally {
      setPendingAction(null);
    }
  };

  const handleDeleteScene = async (scene: DemoScene) => {
    setPendingAction(`delete:${scene.id}`);
    setMessage(null);

    try {
      await deleteScene(projectId, interactiveDemoId, scene.id);
      const nextScenes = orderedScenes.filter((candidate) => candidate.id !== scene.id);
      setLoadedState({ demo, scenes: nextScenes });
      setSceneDrafts(sceneDraftsFromScenes(nextScenes));
    } catch {
      setMessage("Could not delete scene.");
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <PortalShell projectId={projectId} interactiveDemoId={interactiveDemoId} performLogout={performLogout} navigate={navigate}>
      <section className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <div className={styles.eyebrow}>Interactive demo</div>
            <h1 className={styles.title}>{demo.title}</h1>
            {demo.description ? <p className={styles.description}>{demo.description}</p> : null}
            <div className={styles.meta}>
              <span>{demo.source_capture_session_id ? `Source capture: ${demo.source_capture_session_id}` : "No source capture"}</span>
              {demo.source_capture_session_id ? (
                <a className={styles.sourceLink} href={sourceCaptureUrl(projectId, demo.source_capture_session_id)}>
                  Open source capture
                </a>
              ) : null}
            </div>
          </div>
          <span className={styles.badge}>{demo.status}</span>
        </div>
      </section>

      <div className={styles.content}>
        <section className={styles.panel} aria-labelledby="demo-metadata-heading">
          <h2 className={styles.sectionTitle} id="demo-metadata-heading">Demo metadata</h2>
          <label className={styles.field}>
            Demo title
            <input
              value={demoDraft.title}
              onChange={(event) => updateDemoDraft("title", event.target.value)}
            />
          </label>
          <label className={styles.field}>
            Demo description
            <textarea
              value={demoDraft.description}
              onChange={(event) => updateDemoDraft("description", event.target.value)}
            />
          </label>
          <label className={styles.field}>
            Demo status
            <select
              value={demoDraft.status}
              onChange={(event) => updateDemoDraft("status", event.target.value)}
            >
              <option value="draft">draft</option>
              <option value="archived">archived</option>
            </select>
          </label>
          <button className={styles.primaryButton} type="button" disabled={pendingAction === "demo"} onClick={handleSaveDemo}>
            {pendingAction === "demo" ? "Saving demo..." : "Save demo"}
          </button>
          {message ? <div className={styles.message}>{message}</div> : null}
        </section>

        <section aria-labelledby="demo-scenes-heading">
          <h2 className={styles.sectionTitle} id="demo-scenes-heading">Scenes</h2>
          {orderedScenes.length === 0 ? (
            <div className={styles.empty}>No scenes yet.</div>
          ) : (
            <div className={styles.sceneList}>
              {orderedScenes.map((scene, index) => (
                <SceneEditor
                  key={scene.id}
                  projectId={projectId}
                  scene={scene}
                  sceneNumber={index + 1}
                  isFirst={index === 0}
                  isLast={index === orderedScenes.length - 1}
                  draft={sceneDrafts[scene.id] ?? { title: "", description: "" }}
                  pendingAction={pendingAction}
                  resolveAssetUrl={resolveAssetUrl}
                  updateDraft={updateSceneDraft}
                  saveCurrentScene={handleSaveScene}
                  moveScene={(direction) => moveScene(index, direction)}
                  deleteCurrentScene={handleDeleteScene}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </PortalShell>
  );
};

const SceneEditor = ({
  projectId,
  scene,
  sceneNumber,
  isFirst,
  isLast,
  draft,
  pendingAction,
  resolveAssetUrl,
  updateDraft,
  saveCurrentScene,
  moveScene,
  deleteCurrentScene,
}: {
  projectId: string;
  scene: DemoScene;
  sceneNumber: number;
  isFirst: boolean;
  isLast: boolean;
  draft: SceneDraft;
  pendingAction: string | null;
  resolveAssetUrl: (fileUrl: string) => string;
  updateDraft: (sceneId: string, field: keyof SceneDraft, value: string) => void;
  saveCurrentScene: (scene: DemoScene) => Promise<void>;
  moveScene: (direction: -1 | 1) => Promise<void>;
  deleteCurrentScene: (scene: DemoScene) => Promise<void>;
}) => {
  const assetFileUrl = sceneAssetFileUrl(projectId, scene);
  const imageAlt = `${scene.title ?? `Scene ${sceneNumber}`} screenshot`;
  const pending = pendingAction !== null;

  return (
    <article className={styles.scene}>
      <div className={styles.sceneHeader}>
        <h3 className={styles.sceneTitle}>{scene.title ?? `Scene ${sceneNumber}`}</h3>
        <div className={styles.sceneActions}>
          <button className={styles.secondaryButton} type="button" disabled={pending || isFirst} onClick={() => void moveScene(-1)}>
            Move scene {sceneNumber} up
          </button>
          <button className={styles.secondaryButton} type="button" disabled={pending || isLast} onClick={() => void moveScene(1)}>
            Move scene {sceneNumber} down
          </button>
          <button className={styles.dangerButton} type="button" disabled={pending} onClick={() => void deleteCurrentScene(scene)}>
            Delete scene {sceneNumber}
          </button>
        </div>
      </div>
      <div className={styles.screenshotFrame}>
        {assetFileUrl ? (
          <img
            className={styles.screenshot}
            src={resolveAssetUrl(assetFileUrl)}
            alt={imageAlt}
          />
        ) : (
          <div className={styles.placeholder}>No screenshot attached.</div>
        )}
      </div>
      <label className={styles.field}>
        Scene {sceneNumber} title
        <input
          value={draft.title}
          onChange={(event) => updateDraft(scene.id, "title", event.target.value)}
        />
      </label>
      <label className={styles.field}>
        Scene {sceneNumber} description
        <textarea
          value={draft.description}
          onChange={(event) => updateDraft(scene.id, "description", event.target.value)}
        />
      </label>
      <button
        className={styles.primaryButton}
        type="button"
        disabled={pendingAction === `scene:${scene.id}`}
        onClick={() => void saveCurrentScene(scene)}
      >
        {pendingAction === `scene:${scene.id}` ? `Saving scene ${sceneNumber}...` : `Save scene ${sceneNumber}`}
      </button>
    </article>
  );
};
