import { useEffect, useMemo, useState } from "react";
import {
  ApiClientError,
  deleteGuideBlock,
  getGuideDetail,
  reorderGuideBlocks,
  updateGuide,
  updateGuideStep,
} from "../../lib/api";
import type { GuideBlock, GuideDetail, GuideStep } from "./types";
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

export type GuideEditorPageProps = {
  projectId: string;
  guideId: string;
  loadDetail?: (projectId: string, guideId: string) => Promise<GuideDetail>;
  saveGuide?: typeof updateGuide;
  saveStep?: typeof updateGuideStep;
  reorderBlocks?: typeof reorderGuideBlocks;
  removeBlock?: typeof deleteGuideBlock;
};

const sortBlocks = (blocks: GuideBlock[]) => (
  [...blocks].sort((left, right) => left.block_index - right.block_index)
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
  saveGuide = updateGuide,
  saveStep = updateGuideStep,
  reorderBlocks = reorderGuideBlocks,
  removeBlock = deleteGuideBlock,
}: GuideEditorPageProps) => {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [guideDraft, setGuideDraft] = useState<GuideDraft>({ title: "", description: "" });
  const [stepDrafts, setStepDrafts] = useState<Record<string, StepDraft>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

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

  const reload = () => setReloadKey((key) => key + 1);

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
      reload();
    } catch (error: unknown) {
      handleMutationError(error, "Could not delete block.");
    } finally {
      setBusyAction(null);
    }
  };

  if (state.status === "loading") {
    return (
      <PortalShell projectId={projectId} guideId={guideId}>
        <div className={styles.state}>Loading guide...</div>
      </PortalShell>
    );
  }

  if (state.status === "unauthenticated") {
    return (
      <PortalShell projectId={projectId} guideId={guideId}>
        <div className={styles.state}>Sign in to edit this guide.</div>
      </PortalShell>
    );
  }

  if (state.status === "not_found") {
    return (
      <PortalShell projectId={projectId} guideId={guideId}>
        <div className={styles.state}>Guide was not found.</div>
      </PortalShell>
    );
  }

  if (state.status === "error") {
    return (
      <PortalShell projectId={projectId} guideId={guideId}>
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
      notice={notice}
      busyAction={busyAction}
      projectId={projectId}
      guideId={guideId}
      onGuideDraftChange={setGuideDraft}
      onStepDraftChange={(stepId, draft) => setStepDrafts((current) => ({ ...current, [stepId]: draft }))}
      onSaveGuide={saveGuideDraft}
      onSaveStep={saveStepDraft}
      onMoveBlock={moveBlock}
      onDeleteBlock={deleteBlock}
    />
  );
};

const PortalShell = ({
  children,
  projectId,
  guideId,
}: {
  children: React.ReactNode;
  projectId: string;
  guideId: string;
}) => (
  <div className={styles.page}>
    <header className={styles.topbar}>
      <div className={styles.brand}>Demo Composer</div>
      <div className={styles.context}>{projectId} / {guideId}</div>
    </header>
    <main className={styles.main}>{children}</main>
  </div>
);

const GuideEditorView = ({
  detail,
  guideDraft,
  stepDrafts,
  notice,
  busyAction,
  projectId,
  guideId,
  onGuideDraftChange,
  onStepDraftChange,
  onSaveGuide,
  onSaveStep,
  onMoveBlock,
  onDeleteBlock,
}: {
  detail: GuideDetail;
  guideDraft: GuideDraft;
  stepDrafts: Record<string, StepDraft>;
  notice: string | null;
  busyAction: string | null;
  projectId: string;
  guideId: string;
  onGuideDraftChange: (draft: GuideDraft) => void;
  onStepDraftChange: (stepId: string, draft: StepDraft) => void;
  onSaveGuide: () => void;
  onSaveStep: (step: GuideStep) => void;
  onMoveBlock: (blockId: string, direction: -1 | 1) => void;
  onDeleteBlock: (block: GuideBlock) => void;
}) => {
  const sortedBlocks = useMemo(() => sortBlocks(detail.guide_blocks), [detail.guide_blocks]);
  const readOnly = detail.guide.status !== "draft";

  return (
    <PortalShell projectId={projectId} guideId={guideId}>
      <section className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <div className={styles.eyebrow}>Guide editor</div>
            <h1 className={styles.title}>{detail.guide.title}</h1>
            {detail.guide.description ? <p className={styles.description}>{detail.guide.description}</p> : null}
          </div>
          <span className={styles.badge}>{detail.guide.status}</span>
        </div>
        {readOnly ? <div className={styles.notice}>Archived guides are read-only.</div> : null}
        {notice ? <div className={styles.notice}>{notice}</div> : null}
      </section>

      <div className={styles.content}>
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
                  onDraftChange={onStepDraftChange}
                  onSaveStep={onSaveStep}
                  onMoveBlock={onMoveBlock}
                  onDeleteBlock={onDeleteBlock}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </PortalShell>
  );
};

const GuideBlockEditor = ({
  block,
  blockNumber,
  isFirst,
  isLast,
  readOnly,
  busyAction,
  draft,
  onDraftChange,
  onSaveStep,
  onMoveBlock,
  onDeleteBlock,
}: {
  block: GuideBlock;
  blockNumber: number;
  isFirst: boolean;
  isLast: boolean;
  readOnly: boolean;
  busyAction: string | null;
  draft?: StepDraft;
  onDraftChange: (stepId: string, draft: StepDraft) => void;
  onSaveStep: (step: GuideStep) => void;
  onMoveBlock: (blockId: string, direction: -1 | 1) => void;
  onDeleteBlock: (block: GuideBlock) => void;
}) => {
  const step = block.step;
  const actionBusy = busyAction !== null;

  return (
    <article className={styles.block}>
      <div className={styles.blockHeader}>
        <div className={styles.blockIndex}>{blockNumber}</div>
        <div>
          <div className={styles.blockType}>{block.block_type}</div>
          {block.source_capture_asset_id ? (
            <div className={styles.blockMeta}>Screenshot source: {block.source_capture_asset_id}</div>
          ) : null}
        </div>
        <div className={styles.blockActions}>
          <button
            className={styles.iconButton}
            type="button"
            aria-label={`Move step ${blockNumber} up`}
            disabled={readOnly || actionBusy || isFirst}
            onClick={() => onMoveBlock(block.id, -1)}
          >
            ↑
          </button>
          <button
            className={styles.iconButton}
            type="button"
            aria-label={`Move step ${blockNumber} down`}
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
            Delete step {blockNumber}
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
        </div>
      ) : (
        <div className={styles.empty}>This block is not editable yet.</div>
      )}
    </article>
  );
};
