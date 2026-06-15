import { useEffect, useMemo, useState } from "react";
import {
  ApiClientError,
  createInteractiveDemoHotspot,
  deleteInteractiveDemoHotspot,
  deleteInteractiveDemoScene,
  getInteractiveDemo,
  listInteractiveDemoHotspots,
  listInteractiveDemoScenes,
  reorderInteractiveDemoHotspots,
  reorderInteractiveDemoScenes,
  resolveApiAssetUrl,
  updateInteractiveDemoHotspot,
  updateInteractiveDemo,
  updateInteractiveDemoScene,
  type InteractiveDemoHotspotCreateResponse,
  type InteractiveDemoHotspotListResponse,
  type InteractiveDemoHotspotReorderResponse,
  type InteractiveDemoHotspotUpdateResponse,
  type InteractiveDemoDetailResponse,
  type InteractiveDemoSceneListResponse,
  type InteractiveDemoSceneReorderResponse,
  type InteractiveDemoSceneUpdateResponse,
} from "../../lib/api";
import { currentBrowserPath, signInUrl } from "../auth/navigation";
import { PortalTopbar } from "../portal/PortalTopbar";
import type {
  CreateDemoHotspotInput,
  DemoHotspot,
  DemoHotspotType,
  DemoScene,
  InteractiveDemo,
  UpdateDemoHotspotInput,
  UpdateDemoSceneInput,
  UpdateInteractiveDemoInput,
} from "./types";
import styles from "./InteractiveDemoEditorPage.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; demo: InteractiveDemo; scenes: DemoScene[]; hotspotsBySceneId: Record<string, DemoHotspot[]> }
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

type HotspotDraft = {
  hotspot_type: DemoHotspotType;
  label: string;
  content: string;
  x: string;
  y: string;
  width: string;
  height: string;
  target_scene_id: string;
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
  loadHotspots?: (
    projectId: string,
    interactiveDemoId: string,
    sceneId: string
  ) => Promise<InteractiveDemoHotspotListResponse>;
  createHotspot?: (
    projectId: string,
    interactiveDemoId: string,
    sceneId: string,
    input: CreateDemoHotspotInput
  ) => Promise<InteractiveDemoHotspotCreateResponse>;
  saveHotspot?: (
    projectId: string,
    interactiveDemoId: string,
    sceneId: string,
    hotspotId: string,
    input: UpdateDemoHotspotInput
  ) => Promise<InteractiveDemoHotspotUpdateResponse>;
  reorderHotspots?: (
    projectId: string,
    interactiveDemoId: string,
    sceneId: string,
    hotspotIds: string[]
  ) => Promise<InteractiveDemoHotspotReorderResponse>;
  deleteHotspot?: (projectId: string, interactiveDemoId: string, sceneId: string, hotspotId: string) => Promise<void>;
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

const sortedHotspots = (hotspots: DemoHotspot[]) => (
  [...hotspots].sort((left, right) => left.hotspot_index - right.hotspot_index)
);

const hotspotDraftFromHotspot = (hotspot: DemoHotspot): HotspotDraft => ({
  hotspot_type: hotspot.hotspot_type,
  label: hotspot.label ?? "",
  content: hotspot.content ?? "",
  x: String(hotspot.x),
  y: String(hotspot.y),
  width: String(hotspot.width),
  height: String(hotspot.height),
  target_scene_id: hotspot.target_scene_id ?? "",
});

const hotspotDraftsFromHotspots = (hotspotsBySceneId: Record<string, DemoHotspot[]>) => (
  Object.values(hotspotsBySceneId).flat().reduce<Record<string, HotspotDraft>>((drafts, hotspot) => {
    drafts[hotspot.id] = hotspotDraftFromHotspot(hotspot);
    return drafts;
  }, {})
);

const validHotspotBox = (input: Pick<CreateDemoHotspotInput, "x" | "y" | "width" | "height">) => (
  Number.isFinite(input.x)
    && Number.isFinite(input.y)
    && Number.isFinite(input.width)
    && Number.isFinite(input.height)
    && input.x >= 0
    && input.y >= 0
    && input.width > 0
    && input.height > 0
    && input.x + input.width <= 1
    && input.y + input.height <= 1
);

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
  loadHotspots = listInteractiveDemoHotspots,
  createHotspot = createInteractiveDemoHotspot,
  saveHotspot = updateInteractiveDemoHotspot,
  reorderHotspots = reorderInteractiveDemoHotspots,
  deleteHotspot = deleteInteractiveDemoHotspot,
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
      .then(async ([demoResponse, sceneResponse]) => {
        const scenes = sortedScenes(sceneResponse.demo_scenes);
        const hotspotEntries = await Promise.all(scenes.map(async (scene) => {
          try {
            const response = await loadHotspots(projectId, interactiveDemoId, scene.id);
            return [scene.id, sortedHotspots(response.demo_hotspots)] as const;
          } catch {
            return [scene.id, []] as const;
          }
        }));

        if (active) {
          setState({
            status: "loaded",
            demo: demoResponse.interactive_demo,
            scenes,
            hotspotsBySceneId: Object.fromEntries(hotspotEntries),
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
  }, [projectId, interactiveDemoId, loadDemo, loadScenes, loadHotspots, reloadKey]);

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
      hotspotsBySceneId={state.hotspotsBySceneId}
      saveDemo={saveDemo}
      saveScene={saveScene}
      reorderScenes={reorderScenes}
      deleteScene={deleteScene}
      createHotspot={createHotspot}
      saveHotspot={saveHotspot}
      reorderHotspots={reorderHotspots}
      deleteHotspot={deleteHotspot}
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
  hotspotsBySceneId,
  saveDemo,
  saveScene,
  reorderScenes,
  deleteScene,
  createHotspot,
  saveHotspot,
  reorderHotspots,
  deleteHotspot,
  resolveAssetUrl,
  setLoadedState,
  performLogout,
  navigate,
}: {
  projectId: string;
  interactiveDemoId: string;
  demo: InteractiveDemo;
  scenes: DemoScene[];
  hotspotsBySceneId: Record<string, DemoHotspot[]>;
  saveDemo: NonNullable<InteractiveDemoEditorPageProps["saveDemo"]>;
  saveScene: NonNullable<InteractiveDemoEditorPageProps["saveScene"]>;
  reorderScenes: NonNullable<InteractiveDemoEditorPageProps["reorderScenes"]>;
  deleteScene: NonNullable<InteractiveDemoEditorPageProps["deleteScene"]>;
  createHotspot: NonNullable<InteractiveDemoEditorPageProps["createHotspot"]>;
  saveHotspot: NonNullable<InteractiveDemoEditorPageProps["saveHotspot"]>;
  reorderHotspots: NonNullable<InteractiveDemoEditorPageProps["reorderHotspots"]>;
  deleteHotspot: NonNullable<InteractiveDemoEditorPageProps["deleteHotspot"]>;
  resolveAssetUrl: (fileUrl: string) => string;
  setLoadedState: (state: { demo: InteractiveDemo; scenes: DemoScene[]; hotspotsBySceneId: Record<string, DemoHotspot[]> }) => void;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
}) => {
  const orderedScenes = useMemo(() => sortedScenes(scenes), [scenes]);
  const [demoDraft, setDemoDraft] = useState<DemoDraft>(() => demoDraftFromDemo(demo));
  const [sceneDrafts, setSceneDrafts] = useState<Record<string, SceneDraft>>(() => sceneDraftsFromScenes(orderedScenes));
  const [hotspotDrafts, setHotspotDrafts] = useState<Record<string, HotspotDraft>>(() => hotspotDraftsFromHotspots(hotspotsBySceneId));
  const [message, setMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const updateLoadedState = (
    nextDemo: InteractiveDemo,
    nextScenes: DemoScene[],
    nextHotspotsBySceneId: Record<string, DemoHotspot[]>
  ) => {
    setLoadedState({
      demo: nextDemo,
      scenes: nextScenes,
      hotspotsBySceneId: nextHotspotsBySceneId,
    });
  };

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
      updateLoadedState(response.interactive_demo, orderedScenes, hotspotsBySceneId);
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
      updateLoadedState(demo, nextScenes, hotspotsBySceneId);
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
      updateLoadedState(demo, nextScenes, hotspotsBySceneId);
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
      const nextHotspotsBySceneId = { ...hotspotsBySceneId };
      delete nextHotspotsBySceneId[scene.id];
      updateLoadedState(demo, nextScenes, nextHotspotsBySceneId);
      setSceneDrafts(sceneDraftsFromScenes(nextScenes));
    } catch {
      setMessage("Could not delete scene.");
    } finally {
      setPendingAction(null);
    }
  };

  const updateHotspotDraft = (hotspotId: string, field: keyof HotspotDraft, value: string) => {
    setHotspotDrafts((drafts) => ({
      ...drafts,
      [hotspotId]: {
        ...(drafts[hotspotId] ?? {
          hotspot_type: "click",
          label: "",
          content: "",
          x: "0",
          y: "0",
          width: "0.2",
          height: "0.12",
          target_scene_id: "",
        }),
        [field]: value,
      },
    }));
    setMessage(null);
  };

  const replaceSceneHotspots = (sceneId: string, hotspots: DemoHotspot[]) => {
    const nextHotspotsBySceneId = {
      ...hotspotsBySceneId,
      [sceneId]: sortedHotspots(hotspots),
    };
    updateLoadedState(demo, orderedScenes, nextHotspotsBySceneId);
    setHotspotDrafts(hotspotDraftsFromHotspots(nextHotspotsBySceneId));
  };

  const nextTargetSceneId = (sceneId: string) => (
    orderedScenes.find((candidate) => candidate.id !== sceneId)?.id ?? null
  );

  const handleCreateHotspot = async (scene: DemoScene) => {
    const input: CreateDemoHotspotInput = {
      hotspot_type: "click",
      label: "New hotspot",
      content: null,
      x: 0.4,
      y: 0.35,
      width: 0.2,
      height: 0.12,
      target_scene_id: nextTargetSceneId(scene.id),
    };

    setPendingAction(`hotspot:create:${scene.id}`);
    setMessage(null);

    try {
      const response = await createHotspot(projectId, interactiveDemoId, scene.id, input);
      replaceSceneHotspots(scene.id, [...(hotspotsBySceneId[scene.id] ?? []), response.demo_hotspot]);
    } catch {
      setMessage("Could not create hotspot.");
    } finally {
      setPendingAction(null);
    }
  };

  const inputFromHotspotDraft = (draft: HotspotDraft): UpdateDemoHotspotInput | null => {
    const input = {
      hotspot_type: draft.hotspot_type,
      label: draft.label.trim() || null,
      content: draft.content.trim() || null,
      x: Number(draft.x),
      y: Number(draft.y),
      width: Number(draft.width),
      height: Number(draft.height),
      target_scene_id: draft.target_scene_id || null,
    };

    if (!validHotspotBox(input)) {
      return null;
    }

    return input;
  };

  const handleSaveHotspot = async (scene: DemoScene, hotspot: DemoHotspot) => {
    const input = inputFromHotspotDraft(hotspotDrafts[hotspot.id] ?? hotspotDraftFromHotspot(hotspot));
    if (!input) {
      setMessage("Hotspot coordinates must stay inside the screenshot.");
      return;
    }

    setPendingAction(`hotspot:save:${hotspot.id}`);
    setMessage(null);

    try {
      const response = await saveHotspot(projectId, interactiveDemoId, scene.id, hotspot.id, input);
      replaceSceneHotspots(scene.id, (hotspotsBySceneId[scene.id] ?? []).map((candidate) => (
        candidate.id === response.demo_hotspot.id ? response.demo_hotspot : candidate
      )));
      setMessage("Hotspot saved.");
    } catch {
      setMessage("Could not save hotspot.");
    } finally {
      setPendingAction(null);
    }
  };

  const handleDeleteHotspot = async (scene: DemoScene, hotspot: DemoHotspot) => {
    setPendingAction(`hotspot:delete:${hotspot.id}`);
    setMessage(null);

    try {
      await deleteHotspot(projectId, interactiveDemoId, scene.id, hotspot.id);
      replaceSceneHotspots(scene.id, (hotspotsBySceneId[scene.id] ?? []).filter((candidate) => candidate.id !== hotspot.id));
    } catch {
      setMessage("Could not delete hotspot.");
    } finally {
      setPendingAction(null);
    }
  };

  const moveHotspot = async (scene: DemoScene, fromIndex: number, direction: -1 | 1) => {
    const sceneHotspots = sortedHotspots(hotspotsBySceneId[scene.id] ?? []);
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= sceneHotspots.length) {
      return;
    }

    const hotspotIds = sceneHotspots.map((hotspot) => hotspot.id);
    const movingHotspotId = hotspotIds[fromIndex];
    const targetHotspotId = hotspotIds[toIndex];
    if (!movingHotspotId || !targetHotspotId) {
      return;
    }

    hotspotIds[fromIndex] = targetHotspotId;
    hotspotIds[toIndex] = movingHotspotId;
    setPendingAction(`hotspot:reorder:${scene.id}`);
    setMessage(null);

    try {
      const response = await reorderHotspots(projectId, interactiveDemoId, scene.id, hotspotIds);
      replaceSceneHotspots(scene.id, response.demo_hotspots);
    } catch {
      setMessage("Could not reorder hotspots.");
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
                  scenes={orderedScenes}
                  hotspots={sortedHotspots(hotspotsBySceneId[scene.id] ?? [])}
                  hotspotDrafts={hotspotDrafts}
                  updateDraft={updateSceneDraft}
                  updateHotspotDraft={updateHotspotDraft}
                  saveCurrentScene={handleSaveScene}
                  moveScene={(direction) => moveScene(index, direction)}
                  deleteCurrentScene={handleDeleteScene}
                  createCurrentHotspot={handleCreateHotspot}
                  saveCurrentHotspot={handleSaveHotspot}
                  moveHotspot={(hotspotIndex, direction) => moveHotspot(scene, hotspotIndex, direction)}
                  deleteCurrentHotspot={handleDeleteHotspot}
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
  scenes,
  hotspots,
  hotspotDrafts,
  updateDraft,
  updateHotspotDraft,
  saveCurrentScene,
  moveScene,
  deleteCurrentScene,
  createCurrentHotspot,
  saveCurrentHotspot,
  moveHotspot,
  deleteCurrentHotspot,
}: {
  projectId: string;
  scene: DemoScene;
  sceneNumber: number;
  isFirst: boolean;
  isLast: boolean;
  draft: SceneDraft;
  pendingAction: string | null;
  resolveAssetUrl: (fileUrl: string) => string;
  scenes: DemoScene[];
  hotspots: DemoHotspot[];
  hotspotDrafts: Record<string, HotspotDraft>;
  updateDraft: (sceneId: string, field: keyof SceneDraft, value: string) => void;
  updateHotspotDraft: (hotspotId: string, field: keyof HotspotDraft, value: string) => void;
  saveCurrentScene: (scene: DemoScene) => Promise<void>;
  moveScene: (direction: -1 | 1) => Promise<void>;
  deleteCurrentScene: (scene: DemoScene) => Promise<void>;
  createCurrentHotspot: (scene: DemoScene) => Promise<void>;
  saveCurrentHotspot: (scene: DemoScene, hotspot: DemoHotspot) => Promise<void>;
  moveHotspot: (hotspotIndex: number, direction: -1 | 1) => Promise<void>;
  deleteCurrentHotspot: (scene: DemoScene, hotspot: DemoHotspot) => Promise<void>;
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
          <>
            <img
              className={styles.screenshot}
              src={resolveAssetUrl(assetFileUrl)}
              alt={imageAlt}
            />
            {hotspots.map((hotspot) => (
              <button
                key={hotspot.id}
                type="button"
                className={styles.hotspotOverlay}
                aria-label={`Hotspot ${hotspot.label ?? hotspot.hotspot_index}`}
                style={{
                  left: `${hotspot.x * 100}%`,
                  top: `${hotspot.y * 100}%`,
                  width: `${hotspot.width * 100}%`,
                  height: `${hotspot.height * 100}%`,
                }}
              />
            ))}
          </>
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
      <section className={styles.hotspotSection} aria-label={`Scene ${sceneNumber} hotspots`}>
        <div className={styles.hotspotHeader}>
          <h4 className={styles.hotspotTitle}>Hotspots</h4>
          <button
            className={styles.secondaryButton}
            type="button"
            disabled={pending}
            onClick={() => void createCurrentHotspot(scene)}
          >
            Add hotspot to scene {sceneNumber}
          </button>
        </div>
        {hotspots.length === 0 ? (
          <div className={styles.emptyInline}>No hotspots yet.</div>
        ) : (
          <div className={styles.hotspotList}>
            {hotspots.map((hotspot, hotspotIndex) => {
              const hotspotNumber = hotspotIndex + 1;
              const hotspotDraft = hotspotDrafts[hotspot.id] ?? hotspotDraftFromHotspot(hotspot);

              return (
                <div className={styles.hotspotEditor} key={hotspot.id}>
                  <div className={styles.hotspotEditorHeader}>
                    <strong>Hotspot {hotspotNumber}</strong>
                    <div className={styles.sceneActions}>
                      <button
                        className={styles.secondaryButton}
                        type="button"
                        disabled={pending || hotspotIndex === 0}
                        onClick={() => void moveHotspot(hotspotIndex, -1)}
                      >
                        Move hotspot {hotspotNumber} up
                      </button>
                      <button
                        className={styles.secondaryButton}
                        type="button"
                        disabled={pending || hotspotIndex === hotspots.length - 1}
                        onClick={() => void moveHotspot(hotspotIndex, 1)}
                      >
                        Move hotspot {hotspotNumber} down
                      </button>
                    </div>
                  </div>
                  <label className={styles.field}>
                    Hotspot {hotspotNumber} type
                    <select
                      value={hotspotDraft.hotspot_type}
                      onChange={(event) => updateHotspotDraft(hotspot.id, "hotspot_type", event.target.value as DemoHotspotType)}
                    >
                      <option value="click">click</option>
                      <option value="info">info</option>
                      <option value="next">next</option>
                    </select>
                  </label>
                  <label className={styles.field}>
                    Hotspot {hotspotNumber} label
                    <input
                      value={hotspotDraft.label}
                      onChange={(event) => updateHotspotDraft(hotspot.id, "label", event.target.value)}
                    />
                  </label>
                  <label className={styles.field}>
                    Hotspot {hotspotNumber} content
                    <textarea
                      value={hotspotDraft.content}
                      onChange={(event) => updateHotspotDraft(hotspot.id, "content", event.target.value)}
                    />
                  </label>
                  <div className={styles.coordinateGrid}>
                    <label className={styles.field}>
                      Hotspot {hotspotNumber} x
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={hotspotDraft.x}
                        onChange={(event) => updateHotspotDraft(hotspot.id, "x", event.target.value)}
                      />
                    </label>
                    <label className={styles.field}>
                      Hotspot {hotspotNumber} y
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={hotspotDraft.y}
                        onChange={(event) => updateHotspotDraft(hotspot.id, "y", event.target.value)}
                      />
                    </label>
                    <label className={styles.field}>
                      Hotspot {hotspotNumber} width
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="1"
                        value={hotspotDraft.width}
                        onChange={(event) => updateHotspotDraft(hotspot.id, "width", event.target.value)}
                      />
                    </label>
                    <label className={styles.field}>
                      Hotspot {hotspotNumber} height
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="1"
                        value={hotspotDraft.height}
                        onChange={(event) => updateHotspotDraft(hotspot.id, "height", event.target.value)}
                      />
                    </label>
                  </div>
                  <label className={styles.field}>
                    Hotspot {hotspotNumber} target scene
                    <select
                      value={hotspotDraft.target_scene_id}
                      onChange={(event) => updateHotspotDraft(hotspot.id, "target_scene_id", event.target.value)}
                    >
                      <option value="">No target scene</option>
                      {scenes.map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>
                          Scene {candidate.scene_index}: {candidate.title ?? "Untitled scene"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className={styles.sceneActions}>
                    <button
                      className={styles.primaryButton}
                      type="button"
                      disabled={pendingAction === `hotspot:save:${hotspot.id}`}
                      onClick={() => void saveCurrentHotspot(scene, hotspot)}
                    >
                      {pendingAction === `hotspot:save:${hotspot.id}` ? `Saving hotspot ${hotspotNumber}...` : `Save hotspot ${hotspotNumber}`}
                    </button>
                    <button
                      className={styles.dangerButton}
                      type="button"
                      disabled={pendingAction === `hotspot:delete:${hotspot.id}`}
                      onClick={() => void deleteCurrentHotspot(scene, hotspot)}
                    >
                      Delete hotspot {hotspotNumber}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </article>
  );
};
