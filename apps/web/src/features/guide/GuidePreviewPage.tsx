import { useEffect, useMemo, useState } from "react";
import { ApiClientError, getGuideDetail, resolveApiAssetUrl } from "../../lib/api";
import { currentBrowserPath, signInUrl } from "../auth/navigation";
import { PortalTopbar } from "../portal/PortalTopbar";
import {
  GuideScreenshotViewer,
  type GuideScreenshotViewerImage,
} from "./GuideScreenshotViewer";
import type { GuideBlock, GuideDetail, GuideSourceCaptureAsset } from "./types";
import styles from "./GuidePreviewPage.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; detail: GuideDetail }
  | { status: "unauthenticated" }
  | { status: "not_found" }
  | { status: "error" };

export type GuidePreviewPageProps = {
  projectId: string;
  guideId: string;
  loadDetail?: (projectId: string, guideId: string) => Promise<GuideDetail>;
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

const sortBlocks = (blocks: GuideBlock[]) => (
  [...blocks].sort((a, b) => a.block_index - b.block_index)
);

const guideUrl = (projectId: string, guideId: string) => (
  `/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideId)}`
);

const guidePreviewListUrl = (projectId: string) => (
  `/projects/${encodeURIComponent(projectId)}/guides`
);

const assetAltText = (asset: GuideSourceCaptureAsset, stepNumber: number) => (
  asset.page_title ?? asset.file.original_name ?? `Step ${stepNumber} screenshot`
);

const screenshotViewerImageId = (block: GuideBlock, asset: GuideSourceCaptureAsset) => (
  `${block.id}:${asset.id}`
);

export const GuidePreviewPage = ({
  projectId,
  guideId,
  loadDetail = getGuideDetail,
  currentPath = currentBrowserPath(),
  performLogout,
  navigate,
}: GuidePreviewPageProps) => {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    loadDetail(projectId, guideId)
      .then((detail) => {
        if (active) {
          setState({ status: "loaded", detail });
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
  }, [projectId, guideId, loadDetail]);

  if (state.status === "loading") {
    return (
      <PortalShell projectId={projectId} guideId={guideId} performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>Loading guide preview...</div>
      </PortalShell>
    );
  }

  if (state.status === "unauthenticated") {
    return (
      <PortalShell projectId={projectId} guideId={guideId} performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>
          <div>Sign in to preview this guide.</div>
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
        <div className={styles.state}>Could not load guide preview.</div>
      </PortalShell>
    );
  }

  return (
    <GuidePreviewView
      detail={state.detail}
      projectId={projectId}
      guideId={guideId}
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
    <PortalTopbar context={`${projectId} / ${guideId} / preview`} performLogout={performLogout} navigate={navigate} />
    <main className={styles.main}>{children}</main>
  </div>
);

const GuidePreviewView = ({
  detail,
  projectId,
  guideId,
  performLogout,
  navigate,
}: {
  detail: GuideDetail;
  projectId: string;
  guideId: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
}) => {
  const sortedBlocks = useMemo(() => sortBlocks(detail.guide_blocks), [detail.guide_blocks]);
  const [activeScreenshotId, setActiveScreenshotId] = useState<string | null>(null);
  const assetsById = useMemo(() => new Map(
    detail.source_capture_assets.map((asset) => [asset.id, asset])
  ), [detail.source_capture_assets]);
  const screenshotImages = useMemo(() => screenshotImagesFromBlocks(sortedBlocks, assetsById), [assetsById, sortedBlocks]);

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
        <div>
          <div className={styles.eyebrow}>Guide preview</div>
          <h1 className={styles.title}>{detail.guide.title}</h1>
          {detail.guide.description ? <p className={styles.description}>{detail.guide.description}</p> : null}
          <span className={styles.badge}>{detail.guide.status}</span>
        </div>
        <div className={styles.actions}>
          <a className={styles.secondaryLink} href={guidePreviewListUrl(projectId)}>Back to guides</a>
          <a className={styles.primaryLink} href={guideUrl(projectId, guideId)}>Edit guide</a>
        </div>
      </section>

      <section className={styles.document} aria-label="Guide steps">
        {sortedBlocks.length === 0 ? (
          <div className={styles.empty}>This guide does not have any blocks yet.</div>
        ) : (
          sortedBlocks.map((block) => (
            <GuidePreviewBlock
              key={block.id}
              block={block}
              stepNumber={stepNumberForBlock(sortedBlocks, block)}
              asset={assetForBlock(block, assetsById)}
              onOpenScreenshot={setActiveScreenshotId}
            />
          ))
        )}
      </section>
      <GuideScreenshotViewer
        images={screenshotImages}
        activeImageId={activeScreenshotId}
        onActiveImageChange={setActiveScreenshotId}
        onClose={() => setActiveScreenshotId(null)}
      />
    </PortalShell>
  );
};

const assetForBlock = (
  block: GuideBlock,
  assetsById: Map<string, GuideSourceCaptureAsset>
) => {
  const source_capture_asset_id = block.display_capture_asset_id;
  return source_capture_asset_id ? assetsById.get(source_capture_asset_id) : undefined;
};

const screenshotImagesFromBlocks = (
  blocks: GuideBlock[],
  assetsById: Map<string, GuideSourceCaptureAsset>
): GuideScreenshotViewerImage[] => blocks.flatMap((block) => {
  const asset = assetForBlock(block, assetsById);

  if (block.block_type !== "step" || !block.step || !asset) {
    return [];
  }

  const stepNumber = stepNumberForBlock(blocks, block);

  return [{
    id: screenshotViewerImageId(block, asset),
    sourceAssetId: asset.id,
    src: resolveApiAssetUrl(asset.file_url),
    alt: assetAltText(asset, stepNumber),
    title: block.step.title || asset.page_title || asset.file.original_name || `Step ${stepNumber} screenshot`,
  }];
});

const GuidePreviewBlock = ({
  block,
  stepNumber,
  asset,
  onOpenScreenshot,
}: {
  block: GuideBlock;
  stepNumber: number;
  asset?: GuideSourceCaptureAsset;
  onOpenScreenshot: (imageId: string) => void;
}) => {
  if (block.block_type === "header" && block.content?.title) {
    return (
      <section className={styles.callout}>
        <h2 className={styles.calloutTitle}>{block.content.title}</h2>
      </section>
    );
  }

  if ((block.block_type === "tip" || block.block_type === "alert") && block.content) {
    return (
      <aside className={block.block_type === "alert" ? styles.alert : styles.tip}>
        {block.content.title ? <h3 className={styles.calloutTitle}>{block.content.title}</h3> : null}
        {block.content.body ? <p className={styles.stepBody}>{block.content.body}</p> : null}
      </aside>
    );
  }

  if (block.block_type === "paragraph" && block.content?.body) {
    return (
      <section className={styles.callout}>
        <p className={styles.stepBody}>{block.content.body}</p>
      </section>
    );
  }

  if (block.block_type === "divider") {
    return <hr aria-label="Guide section divider" />;
  }

  if (block.block_type !== "step" || !block.step) {
    return (
      <article className={styles.step}>
        <div className={styles.stepNumber}>{stepNumber}</div>
        <div className={styles.stepContent}>
          <div className={styles.unsupported}>Unsupported guide block: {block.block_type}</div>
        </div>
      </article>
    );
  }

  return (
    <article className={styles.step}>
      <div className={styles.stepNumber}>{stepNumber}</div>
      <div className={styles.stepContent}>
        <h2 className={styles.stepTitle}>{block.step.title}</h2>
        {block.step.body ? <p className={styles.stepBody}>{block.step.body}</p> : null}
        {asset ? (
          <div className={styles.media}>
            <button
              className={styles.mediaButton}
              type="button"
              aria-label={`Open screenshot for step ${stepNumber}`}
              onClick={() => onOpenScreenshot(screenshotViewerImageId(block, asset))}
            >
              <img
                className={styles.screenshot}
                src={resolveApiAssetUrl(asset.file_url)}
                alt={assetAltText(asset, stepNumber)}
              />
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
};

const stepNumberForBlock = (blocks: GuideBlock[], target: GuideBlock) => (
  blocks
    .filter((block) => block.block_type === "step" && block.block_index <= target.block_index)
    .length
);
