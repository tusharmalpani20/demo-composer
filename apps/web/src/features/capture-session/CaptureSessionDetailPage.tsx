import { useEffect, useMemo, useState } from "react";
import {
  ApiClientError,
  createGuideFromCaptureSession,
  getCaptureSessionDetail,
  resolveApiAssetUrl,
} from "../../lib/api";
import type { GuideDetail } from "../guide/types";
import type { CaptureAsset, CaptureEvent, CaptureSessionDetail } from "./types";
import styles from "./CaptureSessionDetailPage.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; detail: CaptureSessionDetail }
  | { status: "unauthenticated" }
  | { status: "not_found" }
  | { status: "error" };

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
  redirectTo?: (path: string) => void;
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
  redirectTo = (path) => window.location.assign(path),
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
      <PortalShell projectId={projectId} captureSessionId={captureSessionId}>
        <div className={styles.state}>Loading capture session...</div>
      </PortalShell>
    );
  }

  if (state.status === "unauthenticated") {
    return (
      <PortalShell projectId={projectId} captureSessionId={captureSessionId}>
        <div className={styles.state}>Sign in to view this capture session.</div>
      </PortalShell>
    );
  }

  if (state.status === "not_found") {
    return (
      <PortalShell projectId={projectId} captureSessionId={captureSessionId}>
        <div className={styles.state}>Capture session was not found.</div>
      </PortalShell>
    );
  }

  if (state.status === "error") {
    return (
      <PortalShell projectId={projectId} captureSessionId={captureSessionId}>
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
      redirectTo={redirectTo}
    />
  );
};

const PortalShell = ({
  children,
  projectId,
  captureSessionId,
}: {
  children: React.ReactNode;
  projectId: string;
  captureSessionId: string;
}) => (
  <div className={styles.page}>
    <header className={styles.topbar}>
      <div className={styles.brand}>Demo Composer</div>
      <div className={styles.context}>{projectId} / {captureSessionId}</div>
    </header>
    <main className={styles.main}>{children}</main>
  </div>
);

const CaptureSessionDetailView = ({
  detail,
  projectId,
  captureSessionId,
  resolveAssetUrl,
  createGuide,
  redirectTo,
}: {
  detail: CaptureSessionDetail;
  projectId: string;
  captureSessionId: string;
  resolveAssetUrl: (fileUrl: string) => string;
  createGuide: NonNullable<CaptureSessionDetailPageProps["createGuide"]>;
  redirectTo: NonNullable<CaptureSessionDetailPageProps["redirectTo"]>;
}) => {
  const [createState, setCreateState] = useState<"idle" | "creating" | "error">("idle");
  const assetById = useMemo(() => new Map(
    detail.capture_assets.map((asset) => [asset.id, asset])
  ), [detail.capture_assets]);

  const session = detail.capture_session;
  const guideTitle = session.name.trim();
  const canCreateGuide = guideTitle.length > 0 && createState !== "creating";

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

  return (
    <PortalShell projectId={projectId} captureSessionId={captureSessionId}>
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

      <div className={styles.content}>
        <section className={styles.section} aria-labelledby="events-heading">
          <h2 className={styles.sectionTitle} id="events-heading">Events</h2>
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
}: {
  event: CaptureEvent;
  stepNumber: number;
  linkedAsset?: CaptureAsset;
}) => {
  const pageLabel = eventPageLabel(event);

  return (
    <article className={styles.event}>
      <div className={styles.eventIndex}>{stepNumber}</div>
      <div>
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
