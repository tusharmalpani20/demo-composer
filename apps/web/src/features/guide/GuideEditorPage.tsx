import { useEffect, useMemo, useState } from "react";
import {
  ApiClientError,
  deleteGuideBlock,
  getGuideDetail,
  getGuidePublishStatus,
  publishGuide,
  reorderGuideBlocks,
  resolveApiAssetUrl,
  revokeGuidePublishLink,
  updateGuide,
  updateGuideStep,
} from "../../lib/api";
import { currentBrowserPath, signInUrl } from "../auth/navigation";
import { PortalTopbar } from "../portal/PortalTopbar";
import {
  GuideScreenshotViewer,
  type GuideScreenshotViewerImage,
} from "./GuideScreenshotViewer";
import type {
  GuideBlock,
  GuideDetail,
  GuidePublishResult,
  GuidePublishStatusResponse,
  GuideRevokePublishResult,
  GuideSourceCaptureAsset,
  GuideStep,
} from "./types";
import styles from "./GuideEditorPage.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; detail: GuideDetail }
  | { status: "unauthenticated" }
  | { status: "not_found" }
  | { status: "error" };

type GuideDraft = {
  title: string;
  description: string;
};

type StepDraft = {
  title: string;
  body: string;
};

type PublishState =
  | { status: "loading" }
  | { status: "loaded"; response: GuidePublishStatusResponse }
  | { status: "error" };

export type GuideEditorPageProps = {
  projectId: string;
  guideId: string;
  loadDetail?: (projectId: string, guideId: string) => Promise<GuideDetail>;
  loadPublishStatus?: (projectId: string, guideId: string) => Promise<GuidePublishStatusResponse>;
  publishCurrentGuide?: (projectId: string, guideId: string) => Promise<GuidePublishResult>;
  revokePublishLink?: (projectId: string, guideId: string) => Promise<GuideRevokePublishResult>;
  copyText?: (text: string) => Promise<void>;
  saveGuide?: typeof updateGuide;
  saveStep?: typeof updateGuideStep;
  reorderBlocks?: typeof reorderGuideBlocks;
  removeBlock?: typeof deleteGuideBlock;
  currentPath?: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
};

const sortBlocks = (blocks: GuideBlock[]) => (
  [...blocks].sort((left, right) => left.block_index - right.block_index)
);

const guidePreviewUrl = (projectId: string, guideId: string) => (
  `/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}/preview`
);

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

const isGuideNotEditable = (error: unknown) => (
  error instanceof ApiClientError && error.type === "guide_not_editable"
);

const assetAltText = (asset: GuideSourceCaptureAsset, stepNumber: number) => (
  asset.page_title ?? asset.file.original_name ?? `Step ${stepNumber} screenshot`
);

const screenshotViewerImageId = (block: GuideBlock, asset: GuideSourceCaptureAsset) => (
  `${block.id}:${asset.id}`
);

const defaultCopyText = async (text: string) => {
  if (!navigator.clipboard?.writeText) {
    throw new Error("Clipboard API is unavailable");
  }

  await navigator.clipboard.writeText(text);
};

const publicGuideUrl = (publicUrl: string) => {
  if (publicUrl.startsWith("/")) {
    return new URL(publicUrl, window.location.origin).toString();
  }

  return publicUrl;
};

const isDateAfter = (left: string, right: string) => {
  const leftDate = new Date(left);
  const rightDate = new Date(right);

  if (!Number.isFinite(leftDate.getTime()) || !Number.isFinite(rightDate.getTime())) {
    return false;
  }

  return leftDate.getTime() > rightDate.getTime();
};

const publishErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiClientError) {
    if (error.type === "guide_not_publishable") {
      return "Guide is not publishable.";
    }

    if (error.type === "guide_has_no_publishable_blocks") {
      return "Guide has no publishable blocks.";
    }
  }

  return fallback;
};

const assetForBlock = (
  block: GuideBlock,
  assetsById: Map<string, GuideSourceCaptureAsset>
) => {
  const source_capture_asset_id = block.source_capture_asset_id ?? block.step?.source_capture_asset_id ?? null;
  return source_capture_asset_id ? assetsById.get(source_capture_asset_id) : undefined;
};

const stepDraftsFromBlocks = (blocks: GuideBlock[]) => blocks.reduce<Record<string, StepDraft>>((drafts, block) => {
  if (block.step) {
    drafts[block.step.id] = {
      title: block.step.title,
      body: block.step.body ?? "",
    };
  }

  return drafts;
}, {});

const updateStepInBlocks = (blocks: GuideBlock[], guideStep: GuideStep) => (
  blocks.map((block) => (
    block.step?.id === guideStep.id
      ? { ...block, step: guideStep }
      : block
  ))
);

export const GuideEditorPage = ({
  projectId,
  guideId,
  loadDetail = getGuideDetail,
  loadPublishStatus = getGuidePublishStatus,
  publishCurrentGuide = publishGuide,
  revokePublishLink = revokeGuidePublishLink,
  copyText = defaultCopyText,
  saveGuide = updateGuide,
  saveStep = updateGuideStep,
  reorderBlocks = reorderGuideBlocks,
  removeBlock = deleteGuideBlock,
  currentPath = currentBrowserPath(),
  performLogout,
  navigate,
}: GuideEditorPageProps) => {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [publishState, setPublishState] = useState<PublishState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [publishReloadKey, setPublishReloadKey] = useState(0);
  const [guideDraft, setGuideDraft] = useState<GuideDraft>({ title: "", description: "" });
  const [stepDrafts, setStepDrafts] = useState<Record<string, StepDraft>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [publishBusyAction, setPublishBusyAction] = useState<string | null>(null);
  const [locallyStalePublish, setLocallyStalePublish] = useState(false);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    loadDetail(projectId, guideId)
      .then((detail) => {
        if (active) {
          setState({ status: "loaded", detail });
          setGuideDraft({
            title: detail.guide.title,
            description: detail.guide.description ?? "",
          });
          setStepDrafts(stepDraftsFromBlocks(detail.guide_blocks));
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
  }, [projectId, guideId, loadDetail, reloadKey]);

  useEffect(() => {
    let active = true;
    setPublishState({ status: "loading" });

    loadPublishStatus(projectId, guideId)
      .then((response) => {
        if (active) {
          setPublishState({ status: "loaded", response });
        }
      })
      .catch(() => {
        if (active) {
          setPublishState({ status: "error" });
        }
      });

    return () => {
      active = false;
    };
  }, [projectId, guideId, loadPublishStatus, publishReloadKey]);

  useEffect(() => {
    setLocallyStalePublish(false);
  }, [projectId, guideId]);

  const reload = () => setReloadKey((key) => key + 1);
  const reloadPublishStatus = () => setPublishReloadKey((key) => key + 1);

  const markNotEditable = () => {
    setNotice("Archived guides are read-only.");
    reload();
  };

  const handleMutationError = (error: unknown, fallback: string) => {
    if (isGuideNotEditable(error)) {
      markNotEditable();
      return;
    }

    setNotice(fallback);
  };

  const hasActivePublish = () => (
    publishState.status === "loaded"
    && publishState.response.publish_link?.status === "active"
    && Boolean(publishState.response.published_artifact)
  );

  const markPublishedDraftStale = () => {
    if (hasActivePublish()) {
      setLocallyStalePublish(true);
    }
  };

  const publishCurrent = async () => {
    setPublishBusyAction("publish");
    setNotice(null);

    try {
      const response = await publishCurrentGuide(projectId, guideId);
      setPublishState({ status: "loaded", response });
      setLocallyStalePublish(false);
      setNotice("Guide published.");
    } catch (error: unknown) {
      setNotice(publishErrorMessage(error, "Could not publish guide."));
    } finally {
      setPublishBusyAction(null);
    }
  };

  const revokeCurrent = async () => {
    setPublishBusyAction("revoke");
    setNotice(null);

    try {
      await revokePublishLink(projectId, guideId);
      setPublishState({
        status: "loaded",
        response: {
          publish_link: null,
          published_artifact: null,
        },
      });
      setLocallyStalePublish(false);
      setNotice("Public link revoked.");
    } catch (error: unknown) {
      setNotice(publishErrorMessage(error, "Could not revoke public link."));
    } finally {
      setPublishBusyAction(null);
    }
  };

  const copyCurrent = async (publicUrl: string) => {
    setPublishBusyAction("copy");
    setNotice(null);

    try {
      await copyText(publicGuideUrl(publicUrl));
      setNotice("Public link copied.");
    } catch {
      setNotice("Could not copy public link. Select the URL above.");
    } finally {
      setPublishBusyAction(null);
    }
  };

  const patchDetail = (patch: (detail: GuideDetail) => GuideDetail) => {
    setState((current) => (
      current.status === "loaded"
        ? { status: "loaded", detail: patch(current.detail) }
        : current
    ));
  };

  const saveGuideDraft = async () => {
    if (state.status !== "loaded") {
      return;
    }

    setBusyAction("guide");
    setNotice(null);

    try {
      const response = await saveGuide(projectId, guideId, {
        title: guideDraft.title,
        description: guideDraft.description || null,
      });

      patchDetail((detail) => ({
        ...detail,
        guide: response.guide,
      }));
      setGuideDraft({
        title: response.guide.title,
        description: response.guide.description ?? "",
      });
      markPublishedDraftStale();
    } catch (error: unknown) {
      handleMutationError(error, "Could not save changes.");
    } finally {
      setBusyAction(null);
    }
  };

  const saveStepDraft = async (step: GuideStep) => {
    const draft = stepDrafts[step.id];

    if (!draft) {
      return;
    }

    setBusyAction(`step:${step.id}`);
    setNotice(null);

    try {
      const response = await saveStep(projectId, guideId, step.id, {
        title: draft.title,
        body: draft.body || null,
      });

      patchDetail((detail) => ({
        ...detail,
        guide_blocks: updateStepInBlocks(detail.guide_blocks, response.guide_step),
      }));
      setStepDrafts((current) => ({
        ...current,
        [response.guide_step.id]: {
          title: response.guide_step.title,
          body: response.guide_step.body ?? "",
        },
      }));
      markPublishedDraftStale();
    } catch (error: unknown) {
      handleMutationError(error, "Could not save changes.");
    } finally {
      setBusyAction(null);
    }
  };

  const moveBlock = async (blockId: string, direction: -1 | 1) => {
    if (state.status !== "loaded") {
      return;
    }

    const blocks = sortBlocks(state.detail.guide_blocks);
    const currentIndex = blocks.findIndex((block) => block.id === blockId);
    const nextIndex = currentIndex + direction;

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= blocks.length) {
      return;
    }

    const nextBlockIds = blocks.map((block) => block.id);
    const currentBlockId = nextBlockIds[currentIndex];
    const nextBlockId = nextBlockIds[nextIndex];

    if (!currentBlockId || !nextBlockId) {
      return;
    }

    nextBlockIds[currentIndex] = nextBlockId;
    nextBlockIds[nextIndex] = currentBlockId;

    setBusyAction(`reorder:${blockId}`);
    setNotice(null);

    try {
      const response = await reorderBlocks(projectId, guideId, nextBlockIds);
      patchDetail((detail) => ({
        ...detail,
        guide_blocks: response.guide_blocks,
      }));
      markPublishedDraftStale();
    } catch (error: unknown) {
      handleMutationError(error, "Could not reorder blocks.");
    } finally {
      setBusyAction(null);
    }
  };

  const deleteBlock = async (block: GuideBlock) => {
    if (!window.confirm("Delete this guide block?")) {
      return;
    }

    setBusyAction(`delete:${block.id}`);
    setNotice(null);

    try {
      await removeBlock(projectId, guideId, block.id);
      markPublishedDraftStale();
      reload();
    } catch (error: unknown) {
      handleMutationError(error, "Could not delete block.");
    } finally {
      setBusyAction(null);
    }
  };

  if (state.status === "loading") {
    return (
      <PortalShell projectId={projectId} guideId={guideId} performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>Loading guide...</div>
      </PortalShell>
    );
  }

  if (state.status === "unauthenticated") {
    return (
      <PortalShell projectId={projectId} guideId={guideId} performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>
          <div>Sign in to edit this guide.</div>
          <a className={styles.stateLink} href={signInUrl(currentPath)}>Sign in</a>
        </div>
      </PortalShell>
    );
  }

  if (state.status === "not_found") {
    return (
      <PortalShell projectId={projectId} guideId={guideId} performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>Guide was not found.</div>
      </PortalShell>
    );
  }

  if (state.status === "error") {
    return (
      <PortalShell projectId={projectId} guideId={guideId} performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>
          <div>Could not load guide.</div>
          <button className={styles.secondaryButton} type="button" onClick={reload}>
            Retry
          </button>
        </div>
      </PortalShell>
    );
  }

  return (
    <GuideEditorView
      detail={state.detail}
      guideDraft={guideDraft}
      stepDrafts={stepDrafts}
      publishState={publishState}
      locallyStalePublish={locallyStalePublish}
      notice={notice}
      busyAction={busyAction}
      publishBusyAction={publishBusyAction}
      projectId={projectId}
      guideId={guideId}
      onGuideDraftChange={setGuideDraft}
      onStepDraftChange={(stepId, draft) => setStepDrafts((current) => ({ ...current, [stepId]: draft }))}
      onSaveGuide={saveGuideDraft}
      onSaveStep={saveStepDraft}
      onMoveBlock={moveBlock}
      onDeleteBlock={deleteBlock}
      onPublish={publishCurrent}
      onRevokePublish={revokeCurrent}
      onCopyPublicLink={copyCurrent}
      onRetryPublishStatus={reloadPublishStatus}
      performLogout={performLogout}
      navigate={navigate}
    />
  );
};

const PortalShell = ({
  children,
  projectId,
  guideId,
  performLogout,
  navigate,
}: {
  children: React.ReactNode;
  projectId: string;
  guideId: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
}) => (
  <div className={styles.page}>
    <PortalTopbar context={`${projectId} / ${guideId}`} performLogout={performLogout} navigate={navigate} />
    <main className={styles.main}>{children}</main>
  </div>
);

const GuideEditorView = ({
  detail,
  guideDraft,
  stepDrafts,
  publishState,
  locallyStalePublish,
  notice,
  busyAction,
  publishBusyAction,
  projectId,
  guideId,
  onGuideDraftChange,
  onStepDraftChange,
  onSaveGuide,
  onSaveStep,
  onMoveBlock,
  onDeleteBlock,
  onPublish,
  onRevokePublish,
  onCopyPublicLink,
  onRetryPublishStatus,
  performLogout,
  navigate,
}: {
  detail: GuideDetail;
  guideDraft: GuideDraft;
  stepDrafts: Record<string, StepDraft>;
  publishState: PublishState;
  locallyStalePublish: boolean;
  notice: string | null;
  busyAction: string | null;
  publishBusyAction: string | null;
  projectId: string;
  guideId: string;
  onGuideDraftChange: (draft: GuideDraft) => void;
  onStepDraftChange: (stepId: string, draft: StepDraft) => void;
  onSaveGuide: () => void;
  onSaveStep: (step: GuideStep) => void;
  onMoveBlock: (blockId: string, direction: -1 | 1) => void;
  onDeleteBlock: (block: GuideBlock) => void;
  onPublish: () => void;
  onRevokePublish: () => void;
  onCopyPublicLink: (publicUrl: string) => void;
  onRetryPublishStatus: () => void;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
}) => {
  const sortedBlocks = useMemo(() => sortBlocks(detail.guide_blocks), [detail.guide_blocks]);
  const [activeScreenshotId, setActiveScreenshotId] = useState<string | null>(null);
  const readOnly = detail.guide.status !== "draft";
  const assetsById = useMemo(() => new Map(
    detail.source_capture_assets.map((asset) => [asset.id, asset])
  ), [detail.source_capture_assets]);
  const screenshotImages = useMemo(
    () => screenshotImagesFromBlocks(sortedBlocks, assetsById, stepDrafts),
    [assetsById, sortedBlocks, stepDrafts]
  );

  useEffect(() => {
    if (
      activeScreenshotId
      && !screenshotImages.some((image) => image.id === activeScreenshotId)
    ) {
      setActiveScreenshotId(null);
    }
  }, [activeScreenshotId, screenshotImages]);

  return (
    <PortalShell projectId={projectId} guideId={guideId} performLogout={performLogout} navigate={navigate}>
      <section className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <div className={styles.eyebrow}>Guide editor</div>
            <h1 className={styles.title}>{detail.guide.title}</h1>
            {detail.guide.description ? <p className={styles.description}>{detail.guide.description}</p> : null}
          </div>
          <div className={styles.headerActions}>
            <a className={styles.previewLink} href={guidePreviewUrl(projectId, guideId)}>Preview guide</a>
            <span className={styles.badge}>{detail.guide.status}</span>
          </div>
        </div>
        {readOnly ? <div className={styles.notice}>Archived guides are read-only.</div> : null}
        {notice ? <div className={styles.notice}>{notice}</div> : null}
      </section>

      <div className={styles.content}>
        <div className={styles.panelStack}>
          <PublishPanel
            state={publishState}
            readOnly={readOnly}
            busyAction={publishBusyAction}
            guideUpdatedAt={detail.guide.updated_at}
            locallyStale={locallyStalePublish}
            onPublish={onPublish}
            onRevoke={onRevokePublish}
            onCopyPublicLink={onCopyPublicLink}
            onRetry={onRetryPublishStatus}
          />
          <section className={styles.panel} aria-labelledby="metadata-heading">
            <h2 className={styles.sectionTitle} id="metadata-heading">Guide metadata</h2>
            <label className={styles.field}>
              <span>Guide title</span>
              <input
                value={guideDraft.title}
                disabled={readOnly || busyAction === "guide"}
                onChange={(event) => onGuideDraftChange({
                  ...guideDraft,
                  title: event.target.value,
                })}
              />
            </label>
            <label className={styles.field}>
              <span>Guide description</span>
              <textarea
                value={guideDraft.description}
                disabled={readOnly || busyAction === "guide"}
                rows={5}
                onChange={(event) => onGuideDraftChange({
                  ...guideDraft,
                  description: event.target.value,
                })}
              />
            </label>
            <button
              className={styles.primaryButton}
              type="button"
              disabled={readOnly || busyAction === "guide"}
              onClick={onSaveGuide}
            >
              Save guide
            </button>
          </section>
        </div>

        <section className={styles.panel} aria-labelledby="blocks-heading">
          <h2 className={styles.sectionTitle} id="blocks-heading">Guide blocks</h2>
          {sortedBlocks.length === 0 ? (
            <div className={styles.empty}>This guide does not have any blocks yet.</div>
          ) : (
            <div className={styles.blocks}>
              {sortedBlocks.map((block, index) => (
                <GuideBlockEditor
                  key={block.id}
                  block={block}
                  blockNumber={index + 1}
                  isFirst={index === 0}
                  isLast={index === sortedBlocks.length - 1}
                  readOnly={readOnly}
                  busyAction={busyAction}
                  draft={block.step ? stepDrafts[block.step.id] : undefined}
                  sourceAsset={assetForBlock(block, assetsById)}
                  onDraftChange={onStepDraftChange}
                  onSaveStep={onSaveStep}
                  onMoveBlock={onMoveBlock}
                  onDeleteBlock={onDeleteBlock}
                  onOpenScreenshot={setActiveScreenshotId}
                />
              ))}
            </div>
          )}
        </section>
      </div>
      <GuideScreenshotViewer
        images={screenshotImages}
        activeImageId={activeScreenshotId}
        onActiveImageChange={setActiveScreenshotId}
        onClose={() => setActiveScreenshotId(null)}
      />
    </PortalShell>
  );
};

const formatPublishedAt = (value: string) => {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
};

const PublishPanel = ({
  state,
  readOnly,
  busyAction,
  guideUpdatedAt,
  locallyStale,
  onPublish,
  onRevoke,
  onCopyPublicLink,
  onRetry,
}: {
  state: PublishState;
  readOnly: boolean;
  busyAction: string | null;
  guideUpdatedAt: string;
  locallyStale: boolean;
  onPublish: () => void;
  onRevoke: () => void;
  onCopyPublicLink: (publicUrl: string) => void;
  onRetry: () => void;
}) => {
  const isBusy = busyAction !== null;
  const activeLink = state.status === "loaded" && state.response.publish_link?.status === "active"
    ? state.response.publish_link
    : null;
  const publishedArtifact = state.status === "loaded" ? state.response.published_artifact : null;
  const publishedAt = publishedArtifact ? formatPublishedAt(publishedArtifact.published_at) : null;
  const stale = Boolean(
    activeLink
    && publishedArtifact
    && (locallyStale || isDateAfter(guideUpdatedAt, publishedArtifact.published_at))
  );
  const publishLabel = isBusy && busyAction === "publish" ? "Publishing..." : "Publish guide";
  const republishLabel = isBusy && busyAction === "publish" ? "Republishing..." : "Republish";
  const revokeLabel = isBusy && busyAction === "revoke" ? "Revoking..." : "Revoke link";
  const copyLabel = isBusy && busyAction === "copy" ? "Copying..." : "Copy link";

  return (
    <section className={styles.panel} aria-labelledby="publishing-heading">
      <h2 className={styles.sectionTitle} id="publishing-heading">Publishing</h2>
      {state.status === "loading" ? (
        <div className={styles.publishText}>Loading publishing status...</div>
      ) : null}
      {state.status === "error" ? (
        <div className={styles.publishStack}>
          <div className={styles.publishText}>Could not load publishing status.</div>
          <button className={styles.secondaryButton} type="button" onClick={onRetry}>
            Retry
          </button>
        </div>
      ) : null}
      {state.status === "loaded" && !activeLink ? (
        <div className={styles.publishStack}>
          <div className={styles.publishText}>This guide is not published.</div>
          <p className={styles.publishNote}>Publishing creates a public read-only snapshot.</p>
          <button
            className={styles.primaryButton}
            type="button"
            disabled={readOnly || isBusy}
            onClick={onPublish}
          >
            {publishLabel}
          </button>
        </div>
      ) : null}
      {activeLink && publishedArtifact ? (
        <div className={styles.publishStack}>
          <div className={styles.publishText}>Public guide is live</div>
          {publishedAt ? (
            <div className={styles.publishNote}>
              Published version {publishedArtifact.version_number} on {publishedAt}
            </div>
          ) : (
            <div className={styles.publishNote}>Published version {publishedArtifact.version_number}</div>
          )}
          {stale ? (
            <div className={styles.staleNotice}>Draft has changes not yet published.</div>
          ) : null}
          <div className={styles.publicUrl}>{activeLink.public_url}</div>
          <div className={styles.publishActions}>
            <button
              className={styles.secondaryButton}
              type="button"
              disabled={isBusy}
              onClick={() => onCopyPublicLink(activeLink.public_url)}
            >
              {copyLabel}
            </button>
            <a
              className={styles.previewLink}
              href={activeLink.public_url}
              target="_blank"
              rel="noreferrer"
            >
              Open public guide
            </a>
            <button
              className={styles.primaryButton}
              type="button"
              disabled={readOnly || isBusy}
              onClick={onPublish}
            >
              {republishLabel}
            </button>
            <button
              className={styles.dangerButton}
              type="button"
              disabled={isBusy}
              onClick={onRevoke}
            >
              {revokeLabel}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
};

const screenshotImagesFromBlocks = (
  blocks: GuideBlock[],
  assetsById: Map<string, GuideSourceCaptureAsset>,
  stepDrafts: Record<string, StepDraft>
): GuideScreenshotViewerImage[] => blocks.flatMap((block, index) => {
  const asset = assetForBlock(block, assetsById);

  if (block.block_type !== "step" || !block.step || !asset) {
    return [];
  }

  const stepNumber = index + 1;
  const draftTitle = stepDrafts[block.step.id]?.title;

  return [{
    id: screenshotViewerImageId(block, asset),
    sourceAssetId: asset.id,
    src: resolveApiAssetUrl(asset.file_url),
    alt: assetAltText(asset, stepNumber),
    title: draftTitle || block.step.title || asset.page_title || asset.file.original_name || `Step ${stepNumber} screenshot`,
  }];
});

const GuideBlockEditor = ({
  block,
  blockNumber,
  isFirst,
  isLast,
  readOnly,
  busyAction,
  draft,
  sourceAsset,
  onDraftChange,
  onSaveStep,
  onMoveBlock,
  onDeleteBlock,
  onOpenScreenshot,
}: {
  block: GuideBlock;
  blockNumber: number;
  isFirst: boolean;
  isLast: boolean;
  readOnly: boolean;
  busyAction: string | null;
  draft?: StepDraft;
  sourceAsset?: GuideSourceCaptureAsset;
  onDraftChange: (stepId: string, draft: StepDraft) => void;
  onSaveStep: (step: GuideStep) => void;
  onMoveBlock: (blockId: string, direction: -1 | 1) => void;
  onDeleteBlock: (block: GuideBlock) => void;
  onOpenScreenshot: (imageId: string) => void;
}) => {
  const step = block.step;
  const actionLabel = step ? "step" : "block";
  const actionBusy = busyAction !== null;

  return (
    <article className={styles.block}>
      <div className={styles.blockHeader}>
        <div className={styles.blockIndex}>{blockNumber}</div>
        <div>
          <div className={styles.blockType}>{block.block_type}</div>
          {sourceAsset ? (
            <div className={styles.blockMeta}>
              {sourceAsset.page_title ?? sourceAsset.file.original_name ?? "Source screenshot"}
            </div>
          ) : null}
        </div>
        <div className={styles.blockActions}>
          <button
            className={styles.iconButton}
            type="button"
            aria-label={`Move ${actionLabel} ${blockNumber} up`}
            disabled={readOnly || actionBusy || isFirst}
            onClick={() => onMoveBlock(block.id, -1)}
          >
            ↑
          </button>
          <button
            className={styles.iconButton}
            type="button"
            aria-label={`Move ${actionLabel} ${blockNumber} down`}
            disabled={readOnly || actionBusy || isLast}
            onClick={() => onMoveBlock(block.id, 1)}
          >
            ↓
          </button>
          <button
            className={styles.dangerButton}
            type="button"
            disabled={readOnly || actionBusy}
            onClick={() => onDeleteBlock(block)}
          >
            Delete {actionLabel} {blockNumber}
          </button>
        </div>
      </div>

      {step && draft ? (
        <div className={styles.stepForm}>
          <label className={styles.field}>
            <span>Step title</span>
            <input
              aria-label={`Step title ${blockNumber}`}
              value={draft.title}
              disabled={readOnly || busyAction === `step:${step.id}`}
              onChange={(event) => onDraftChange(step.id, {
                ...draft,
                title: event.target.value,
              })}
            />
          </label>
          <label className={styles.field}>
            <span>Step body</span>
            <textarea
              aria-label={`Step body ${blockNumber}`}
              value={draft.body}
              disabled={readOnly || busyAction === `step:${step.id}`}
              rows={4}
              onChange={(event) => onDraftChange(step.id, {
                ...draft,
                body: event.target.value,
              })}
            />
          </label>
          <button
            className={styles.secondaryButton}
            type="button"
            disabled={readOnly || busyAction === `step:${step.id}`}
            onClick={() => onSaveStep(step)}
          >
            Save step {blockNumber}
          </button>
          {sourceAsset ? (
            <div className={styles.media}>
              <button
                className={styles.mediaButton}
                type="button"
                aria-label={`Open screenshot for step ${blockNumber}`}
                onClick={() => onOpenScreenshot(screenshotViewerImageId(block, sourceAsset))}
              >
                <img
                  className={styles.screenshot}
                  src={resolveApiAssetUrl(sourceAsset.file_url)}
                  alt={assetAltText(sourceAsset, blockNumber)}
                />
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className={styles.empty}>This block is not editable yet.</div>
      )}
    </article>
  );
};
