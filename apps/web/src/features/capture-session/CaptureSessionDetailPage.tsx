import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ApiClientError,
  createCaptureSessionEvent,
  createGuideFromCaptureSession,
  getCaptureSessionDetail,
  reorderCaptureSessionEvents,
  resolveApiAssetUrl,
  uploadCaptureSessionAsset,
} from "../../lib/api";
import { currentBrowserPath, signInUrl } from "../auth/navigation";
import type { GuideDetail } from "../guide/types";
import { PortalTopbar } from "../portal/PortalTopbar";
import type {
  CaptureAsset,
  CaptureEvent,
  CaptureSessionDetail,
  CreateCaptureEventResponse,
  ReorderCaptureEventsInput,
  ReorderCaptureEventsResponse,
  UploadCaptureAssetResponse,
} from "./types";
import styles from "./CaptureSessionDetailPage.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; detail: CaptureSessionDetail }
  | { status: "unauthenticated" }
  | { status: "not_found" }
  | { status: "error" };

type UploadQueueItem = {
  id: string;
  name: string;
  status: "queued" | "uploading" | "event_created" | "failed";
};

type CaptureSessionDetailPageProps = {
  projectId: string;
  captureSessionId: string;
  loadDetail?: (projectId: string, captureSessionId: string) => Promise<CaptureSessionDetail>;
  resolveAssetUrl?: (fileUrl: string) => string;
  createGuide?: (
    projectId: string,
    captureSessionId: string,
    data: {
      title: string;
      description?: string | null;
    }
  ) => Promise<GuideDetail>;
  uploadAsset?: (
    projectId: string,
    captureSessionId: string,
    input: {
      file: File;
      page_url?: string | null;
      page_title?: string | null;
      captured_at?: string;
    }
  ) => Promise<UploadCaptureAssetResponse>;
  createCaptureEvent?: (
    projectId: string,
    captureSessionId: string,
    input: {
      event_type: "capture";
      event_index: number;
      capture_asset_id?: string | null;
      occurred_at?: string | null;
      page_url?: string | null;
      page_title?: string | null;
      target_label?: string | null;
      note?: string | null;
    }
  ) => Promise<CreateCaptureEventResponse>;
  reorderEvents?: (
    projectId: string,
    captureSessionId: string,
    input: ReorderCaptureEventsInput
  ) => Promise<ReorderCaptureEventsResponse>;
  redirectTo?: (path: string) => void;
  currentPath?: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
};

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const formatBytes = (value: number) => {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`;
  }

  return `${(value / 1024 / 1024).toFixed(1)} MB`;
};

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? "" : "s"}`;

const eventTitle = (event: CaptureEvent) => (
  event.note
  ?? event.target_label
  ?? event.page_title
  ?? event.target_text
  ?? event.event_type
);

const assetTitle = (asset: CaptureAsset) => (
  asset.file.original_name
  ?? asset.page_title
  ?? asset.page_url
  ?? asset.asset_type
);

const assetAltText = (asset: CaptureAsset) => `${asset.page_title ?? asset.file.original_name ?? "Capture"} screenshot`;

const allowedScreenshotMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

const optionalUploadField = (value: string) => {
  const trimmed = value.trim();

  return trimmed || null;
};

const nextEventIndex = (events: CaptureEvent[]) => (
  events.reduce((nextIndex, event) => Math.max(nextIndex, event.event_index + 1), 1)
);

const uploadErrorMessage = (error: unknown) => {
  if (error instanceof ApiClientError) {
    if (error.kind === "unauthenticated") {
      return "Sign in to upload screenshots.";
    }

    if (error.kind === "not_found") {
      return "Capture session was not found.";
    }

    if (error.type === "invalid_capture_asset_upload" || error.type === "upload_file_required") {
      return "Screenshot input is invalid.";
    }

    if (error.type === "upload_too_large") {
      return "Screenshot is too large.";
    }
  }

  return "Could not upload screenshot.";
};

const eventCreationAfterUploadErrorMessage = (error: unknown) => {
  if (error instanceof ApiClientError && error.type === "capture_event_index_conflict") {
    return "Screenshot uploaded, but another event used that order. Reload and try again.";
  }

  return "Screenshot uploaded, but the capture event could not be created. Reload and try again.";
};

const uploadStatusLabel = (status: UploadQueueItem["status"]) => {
  if (status === "uploading") {
    return "Uploading";
  }

  if (status === "event_created") {
    return "Event created";
  }

  if (status === "failed") {
    return "Failed";
  }

  return "Queued";
};

const reorderErrorMessage = (error: unknown) => {
  if (error instanceof ApiClientError) {
    if (error.kind === "unauthenticated") {
      return "Sign in to reorder capture events.";
    }

    if (error.kind === "not_found") {
      return "Capture session was not found.";
    }

    if (error.type === "invalid_capture_event_order") {
      return "Capture event order is invalid.";
    }

    if (error.type === "capture_event_reorder_not_allowed") {
      return "Only manual capture sessions can be reordered.";
    }
  }

  return "Could not reorder capture events.";
};

const eventPageLabel = (event: CaptureEvent) => {
  if (!event.page_url) {
    return null;
  }

  try {
    return new URL(event.page_url).hostname;
  } catch {
    return event.page_url;
  }
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

export const CaptureSessionDetailPage = ({
  projectId,
  captureSessionId,
  loadDetail = getCaptureSessionDetail,
  resolveAssetUrl = resolveApiAssetUrl,
  createGuide = createGuideFromCaptureSession,
  uploadAsset = uploadCaptureSessionAsset,
  createCaptureEvent: createCaptureEventAction = createCaptureSessionEvent,
  reorderEvents = reorderCaptureSessionEvents,
  redirectTo = (path) => window.location.assign(path),
  currentPath = currentBrowserPath(),
  performLogout,
  navigate,
}: CaptureSessionDetailPageProps) => {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    loadDetail(projectId, captureSessionId)
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
  }, [projectId, captureSessionId, loadDetail, reloadKey]);

  if (state.status === "loading") {
    return (
      <PortalShell projectId={projectId} captureSessionId={captureSessionId} performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>Loading capture session...</div>
      </PortalShell>
    );
  }

  if (state.status === "unauthenticated") {
    return (
      <PortalShell projectId={projectId} captureSessionId={captureSessionId} performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>
          <div>Sign in to view this capture session.</div>
          <a className={styles.stateLink} href={signInUrl(currentPath)}>Sign in</a>
        </div>
      </PortalShell>
    );
  }

  if (state.status === "not_found") {
    return (
      <PortalShell projectId={projectId} captureSessionId={captureSessionId} performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>Capture session was not found.</div>
      </PortalShell>
    );
  }

  if (state.status === "error") {
    return (
      <PortalShell projectId={projectId} captureSessionId={captureSessionId} performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>
          <div>Could not load capture session.</div>
          <button className={styles.retryButton} type="button" onClick={() => setReloadKey((key) => key + 1)}>
            Retry
          </button>
        </div>
      </PortalShell>
    );
  }

  return (
    <CaptureSessionDetailView
      detail={state.detail}
      projectId={projectId}
      captureSessionId={captureSessionId}
      resolveAssetUrl={resolveAssetUrl}
      createGuide={createGuide}
      uploadAsset={uploadAsset}
      createCaptureEvent={createCaptureEventAction}
      reorderEvents={reorderEvents}
      reloadDetail={() => setReloadKey((key) => key + 1)}
      redirectTo={redirectTo}
      performLogout={performLogout}
      navigate={navigate}
    />
  );
};

const PortalShell = ({
  children,
  projectId,
  captureSessionId,
  performLogout,
  navigate,
}: {
  children: React.ReactNode;
  projectId: string;
  captureSessionId: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
}) => (
  <div className={styles.page}>
    <PortalTopbar context={`${projectId} / ${captureSessionId}`} performLogout={performLogout} navigate={navigate} />
    <main className={styles.main}>{children}</main>
  </div>
);

const CaptureSessionDetailView = ({
  detail,
  projectId,
  captureSessionId,
  resolveAssetUrl,
  createGuide,
  uploadAsset,
  createCaptureEvent,
  reorderEvents,
  reloadDetail,
  redirectTo,
  performLogout,
  navigate,
}: {
  detail: CaptureSessionDetail;
  projectId: string;
  captureSessionId: string;
  resolveAssetUrl: (fileUrl: string) => string;
  createGuide: NonNullable<CaptureSessionDetailPageProps["createGuide"]>;
  uploadAsset: NonNullable<CaptureSessionDetailPageProps["uploadAsset"]>;
  createCaptureEvent: NonNullable<CaptureSessionDetailPageProps["createCaptureEvent"]>;
  reorderEvents: NonNullable<CaptureSessionDetailPageProps["reorderEvents"]>;
  reloadDetail: () => void;
  redirectTo: NonNullable<CaptureSessionDetailPageProps["redirectTo"]>;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
}) => {
  const [createState, setCreateState] = useState<"idle" | "creating" | "error">("idle");
  const [uploadState, setUploadState] = useState<"idle" | "uploading">("idle");
  const [reorderState, setReorderState] = useState<"idle" | "reordering">("idle");
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [uploadPageTitle, setUploadPageTitle] = useState("");
  const [uploadPageUrl, setUploadPageUrl] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const uploadFileInputRef = useRef<HTMLInputElement | null>(null);
  const assetById = useMemo(() => new Map(
    detail.capture_assets.map((asset) => [asset.id, asset])
  ), [detail.capture_assets]);

  const session = detail.capture_session;
  const guideTitle = session.name.trim();
  const canCreateGuide = guideTitle.length > 0 && createState !== "creating";
  const canUploadScreenshot = session.source_type === "manual";
  const isUploading = uploadState === "uploading";
  const uploadButtonText = isUploading
    ? "Uploading Screenshots..."
    : uploadFiles.length > 1
      ? "Upload Screenshots"
      : "Upload Screenshot";
  const canReorderEvents = session.source_type === "manual" && detail.capture_events.length > 1;
  const isReordering = reorderState === "reordering";

  const handleCreateGuide = async () => {
    if (!canCreateGuide) {
      return;
    }

    setCreateState("creating");

    try {
      const guideDetail = await createGuide(projectId, captureSessionId, {
        title: guideTitle,
        description: session.description ?? null,
      });
      redirectTo(`/projects/${encodeURIComponent(projectId)}/guides/${encodeURIComponent(guideDetail.guide.id)}`);
    } catch {
      setCreateState("error");
    }
  };

  const clearUploadForm = () => {
    setUploadFiles([]);
    setUploadQueue([]);
    setUploadPageTitle("");
    setUploadPageUrl("");
    if (uploadFileInputRef.current) {
      uploadFileInputRef.current.value = "";
    }
  };

  const updateUploadFiles = (files: File[]) => {
    setUploadFiles(files);
    setUploadQueue(files.map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${index}`,
      name: file.name,
      status: "queued",
    })));
    setUploadError(null);
  };

  const updateUploadPageTitle = (value: string) => {
    setUploadPageTitle(value);
    setUploadError(null);
  };

  const updateUploadPageUrl = (value: string) => {
    setUploadPageUrl(value);
    setUploadError(null);
  };

  const handleUploadScreenshot = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isUploading) {
      return;
    }

    if (uploadFiles.length === 0) {
      setUploadError("Choose a screenshot to upload.");
      return;
    }

    if (uploadFiles.some((file) => !allowedScreenshotMimeTypes.has(file.type))) {
      setUploadError("Only PNG, JPEG, and WebP screenshots can be uploaded.");
      return;
    }

    const pageTitle = optionalUploadField(uploadPageTitle);
    const pageUrl = optionalUploadField(uploadPageUrl);
    const baseEventIndex = nextEventIndex(detail.capture_events);
    let createdEventCount = 0;

    setUploadState("uploading");
    setUploadError(null);
    setUploadQueue(uploadFiles.map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${index}`,
      name: file.name,
      status: "queued",
    })));

    try {
      for (const [index, uploadFile] of uploadFiles.entries()) {
        const capturedAt = new Date().toISOString();

        setUploadQueue((items) => items.map((item, itemIndex) => (
          itemIndex === index ? { ...item, status: "uploading" } : item
        )));

        const uploadResponse = await uploadAsset(projectId, captureSessionId, {
          file: uploadFile,
          page_title: pageTitle,
          page_url: pageUrl,
          captured_at: capturedAt,
        });

        try {
          await createCaptureEvent(projectId, captureSessionId, {
            event_type: "capture",
            event_index: baseEventIndex + index,
            capture_asset_id: uploadResponse.capture_asset.id,
            occurred_at: capturedAt,
            page_title: pageTitle,
            page_url: pageUrl,
            target_label: "Uploaded screenshot",
            note: `Uploaded screenshot: ${uploadFile.name}`,
          });
        } catch (error: unknown) {
          setUploadQueue((items) => items.map((item, itemIndex) => (
            itemIndex === index ? { ...item, status: "failed" } : item
          )));
          setUploadError(eventCreationAfterUploadErrorMessage(error));
          reloadDetail();
          return;
        }

        createdEventCount += 1;
        setUploadQueue((items) => items.map((item, itemIndex) => (
          itemIndex === index ? { ...item, status: "event_created" } : item
        )));
      }

      clearUploadForm();
      reloadDetail();
    } catch (error: unknown) {
      const failedIndex = createdEventCount;
      setUploadQueue((items) => items.map((item, itemIndex) => (
        itemIndex === failedIndex ? { ...item, status: "failed" } : item
      )));
      setUploadError(uploadErrorMessage(error));
      if (createdEventCount > 0) {
        reloadDetail();
      }
    } finally {
      setUploadState("idle");
    }
  };

  const moveEvent = async (fromIndex: number, direction: -1 | 1) => {
    if (!canReorderEvents || isReordering) {
      return;
    }

    const toIndex = fromIndex + direction;

    if (toIndex < 0 || toIndex >= detail.capture_events.length) {
      return;
    }

    const eventIds = detail.capture_events.map((event) => event.id);
    const movingEventId = eventIds[fromIndex];
    const targetEventId = eventIds[toIndex];

    if (!movingEventId || !targetEventId) {
      return;
    }

    eventIds[fromIndex] = targetEventId;
    eventIds[toIndex] = movingEventId;

    setReorderState("reordering");
    setReorderError(null);

    try {
      await reorderEvents(projectId, captureSessionId, { event_ids: eventIds });
      reloadDetail();
    } catch (error: unknown) {
      setReorderError(reorderErrorMessage(error));
    } finally {
      setReorderState("idle");
    }
  };

  return (
    <PortalShell projectId={projectId} captureSessionId={captureSessionId} performLogout={performLogout} navigate={navigate}>
      <section className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <div className={styles.eyebrow}>Capture session</div>
            <h1 className={styles.title}>{session.name}</h1>
            {session.description ? <p className={styles.description}>{session.description}</p> : null}
          </div>
          <div className={styles.badges}>
            <span className={styles.badge}>{session.status}</span>
            <span className={styles.badge}>{session.source_type}</span>
          </div>
        </div>
        <div className={styles.actionRow}>
          <button
            className={styles.primaryButton}
            type="button"
            disabled={!canCreateGuide}
            onClick={handleCreateGuide}
          >
            {createState === "creating" ? "Creating guide..." : "Create guide"}
          </button>
          {guideTitle.length === 0 ? (
            <div className={styles.actionMessage}>Capture session needs a name before creating a guide.</div>
          ) : null}
          {createState === "error" ? (
            <div className={styles.actionMessage}>Could not create guide.</div>
          ) : null}
        </div>

        <div className={styles.metrics}>
          <Metric label="Events" value={plural(detail.capture_events.length, "event")} />
          <Metric label="Assets" value={plural(detail.capture_assets.length, "asset")} />
          <Metric label="Started" value={formatDateTime(session.started_at)} />
          <Metric label="Completed" value={formatDateTime(session.completed_at)} />
          <Metric label="Browser" value={[session.browser_name, session.browser_version].filter(Boolean).join(" ") || "Not set"} />
          <Metric label="System" value={session.operating_system ?? "Not set"} />
          <Metric label="Viewport" value={session.viewport_width && session.viewport_height ? `${session.viewport_width} x ${session.viewport_height}` : "Not set"} />
          <Metric label="Device scale" value={session.device_pixel_ratio ? `${session.device_pixel_ratio}x` : "Not set"} />
        </div>
      </section>

      {canUploadScreenshot ? (
        <section className={styles.uploadPanel} aria-labelledby="upload-screenshot-heading">
          <h2 className={styles.uploadTitle} id="upload-screenshot-heading">Upload screenshot</h2>
          <form className={styles.uploadForm} onSubmit={handleUploadScreenshot}>
            {uploadError ? <div className={styles.formError}>{uploadError}</div> : null}
            <label className={styles.field}>
              <span>Screenshot file</span>
              <input
                ref={uploadFileInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                disabled={isUploading}
                onChange={(event) => updateUploadFiles(Array.from(event.target.files ?? []))}
              />
            </label>
            {uploadQueue.length > 0 ? (
              <div className={styles.uploadQueue} aria-label="Selected screenshots">
                {uploadQueue.map((item) => (
                  <div className={styles.uploadQueueItem} key={item.id}>
                    <span className={styles.uploadQueueName}>{item.name}</span>
                    <span className={styles.uploadQueueStatus}>{uploadStatusLabel(item.status)}</span>
                  </div>
                ))}
              </div>
            ) : null}
            <label className={styles.field}>
              <span>Page title</span>
              <input
                value={uploadPageTitle}
                disabled={isUploading}
                onChange={(event) => updateUploadPageTitle(event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span>Page URL</span>
              <input
                value={uploadPageUrl}
                disabled={isUploading}
                onChange={(event) => updateUploadPageUrl(event.target.value)}
              />
            </label>
            <div className={styles.uploadActions}>
              <button className={styles.primaryButton} type="submit" disabled={isUploading}>
                {uploadButtonText}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <div className={styles.content}>
        <section className={styles.section} aria-labelledby="events-heading">
          <h2 className={styles.sectionTitle} id="events-heading">Events</h2>
          {reorderError ? <div className={styles.formError}>{reorderError}</div> : null}
          {detail.capture_events.length === 0 ? (
            <div className={styles.empty}>No capture events yet.</div>
          ) : (
            <div className={styles.timeline}>
              {detail.capture_events.map((event, index) => (
                <EventRow
                  key={event.id}
                  event={event}
                  stepNumber={index + 1}
                  linkedAsset={event.capture_asset_id ? assetById.get(event.capture_asset_id) : undefined}
                  canReorder={canReorderEvents}
                  disableReorder={isReordering}
                  isFirst={index === 0}
                  isLast={index === detail.capture_events.length - 1}
                  onMoveUp={() => moveEvent(index, -1)}
                  onMoveDown={() => moveEvent(index, 1)}
                />
              ))}
            </div>
          )}
        </section>

        <section className={styles.section} aria-labelledby="assets-heading">
          <h2 className={styles.sectionTitle} id="assets-heading">Assets</h2>
          {detail.capture_assets.length === 0 ? (
            <div className={styles.empty}>No capture assets yet.</div>
          ) : (
            <div className={styles.assets}>
              {detail.capture_assets.map((asset, index) => (
                <AssetPreview
                  key={asset.id}
                  asset={asset}
                  imageUrl={resolveAssetUrl(asset.file_url)}
                  eager={index === 0}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </PortalShell>
  );
};

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className={styles.metric}>
    <div className={styles.metricLabel}>{label}</div>
    <div className={styles.metricValue}>{value}</div>
  </div>
);

const EventRow = ({
  event,
  stepNumber,
  linkedAsset,
  canReorder,
  disableReorder,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
}: {
  event: CaptureEvent;
  stepNumber: number;
  linkedAsset?: CaptureAsset;
  canReorder: boolean;
  disableReorder: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) => {
  const pageLabel = eventPageLabel(event);

  return (
    <article className={styles.event}>
      <div className={styles.eventIndex}>{stepNumber}</div>
      <div className={styles.eventBody}>
        <div className={styles.eventHeader}>
          <span className={styles.eventTitle}>{eventTitle(event)}</span>
          <span className={styles.eventType}>{event.event_type}</span>
        </div>
        <div className={styles.eventMeta}>
          {formatDateTime(event.occurred_at)}
          {pageLabel ? ` · ${pageLabel}` : ""}
        </div>
        {linkedAsset ? <div className={styles.linkedAsset}>Linked screenshot</div> : null}
      </div>
      {canReorder ? (
        <div className={styles.eventActions}>
          <button
            className={styles.eventMoveButton}
            type="button"
            disabled={disableReorder || isFirst}
            aria-label={`Move event ${stepNumber} up`}
            onClick={onMoveUp}
          >
            Up
          </button>
          <button
            className={styles.eventMoveButton}
            type="button"
            disabled={disableReorder || isLast}
            aria-label={`Move event ${stepNumber} down`}
            onClick={onMoveDown}
          >
            Down
          </button>
        </div>
      ) : null}
    </article>
  );
};

const AssetPreview = ({
  asset,
  imageUrl,
  eager,
}: {
  asset: CaptureAsset;
  imageUrl: string;
  eager: boolean;
}) => (
  <article className={styles.asset}>
    <img
      className={styles.preview}
      src={imageUrl}
      alt={assetAltText(asset)}
      loading={eager ? "eager" : "lazy"}
    />
    <div className={styles.assetBody}>
      <div className={styles.assetTitle}>{assetTitle(asset)}</div>
      <div className={styles.assetMeta}>
        {asset.width && asset.height ? `${asset.width} x ${asset.height}` : "Dimensions unknown"}
        {asset.device_pixel_ratio ? ` · ${asset.device_pixel_ratio}x` : ""}
      </div>
      <div className={styles.assetMeta}>
        {asset.file.mime_type} · {formatBytes(asset.file.size_bytes)} · {formatDateTime(asset.captured_at)}
      </div>
      {asset.page_title || asset.page_url ? (
        <div className={styles.assetMeta}>{asset.page_title ?? asset.page_url}</div>
      ) : null}
    </div>
  </article>
);
