import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./GuideScreenshotViewer.module.css";

export type GuideScreenshotViewerImage = {
  id: string;
  sourceAssetId: string;
  src: string;
  alt: string;
  title: string;
};

export type GuideScreenshotViewerProps = {
  images: GuideScreenshotViewerImage[];
  activeImageId: string | null;
  onActiveImageChange: (imageId: string) => void;
  onClose: () => void;
};

const zoomLevels = [0.75, 1, 1.25, 1.5, 2, 3] as const;

type ZoomState = "fit" | typeof zoomLevels[number];

const zoomLabel = (zoom: ZoomState) => (
  zoom === "fit" ? "Fit" : `${Math.round(zoom * 100)}%`
);

const nextZoom = (zoom: ZoomState) => {
  if (zoom === "fit") {
    return 1;
  }

  const index = zoomLevels.indexOf(zoom);
  return zoomLevels[Math.min(index + 1, zoomLevels.length - 1)] ?? zoom;
};

const previousZoom = (zoom: ZoomState) => {
  if (zoom === "fit") {
    return "fit";
  }

  const index = zoomLevels.indexOf(zoom);
  return zoomLevels[Math.max(index - 1, 0)] ?? zoom;
};

export const GuideScreenshotViewer = ({
  images,
  activeImageId,
  onActiveImageChange,
  onClose,
}: GuideScreenshotViewerProps) => {
  const [zoom, setZoom] = useState<ZoomState>("fit");
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const activeIndex = images.findIndex((image) => image.id === activeImageId);
  const activeImage = activeIndex >= 0 ? images[activeIndex] : null;
  const hasMultipleImages = images.length > 1;

  const navigation = useMemo(() => {
    if (!activeImage || activeIndex < 0) {
      return {
        previous: null,
        next: null,
      };
    }

    return {
      previous: activeIndex > 0 ? images[activeIndex - 1] : null,
      next: activeIndex < images.length - 1 ? images[activeIndex + 1] : null,
    };
  }, [activeImage, activeIndex, images]);

  useEffect(() => {
    setZoom("fit");
  }, [activeImageId]);

  useEffect(() => {
    if (!activeImage) {
      return;
    }

    closeButtonRef.current?.focus();
  }, [activeImage]);

  useEffect(() => {
    if (!activeImage) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "ArrowLeft" && navigation.previous) {
        onActiveImageChange(navigation.previous.id);
      }

      if (event.key === "ArrowRight" && navigation.next) {
        onActiveImageChange(navigation.next.id);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeImage, navigation.next, navigation.previous, onActiveImageChange, onClose]);

  if (!activeImage) {
    return null;
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} aria-hidden="true" onClick={onClose} />
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={activeImage.title}
      >
        <header className={styles.header}>
          <div className={styles.titleGroup}>
            <h2 className={styles.title}>{activeImage.title}</h2>
            <div className={styles.counter}>{activeIndex + 1} / {images.length}</div>
          </div>
          <button
            ref={closeButtonRef}
            className={styles.iconButton}
            type="button"
            aria-label="Close screenshot viewer"
            onClick={onClose}
          >
            x
          </button>
        </header>

        <div className={styles.toolbar}>
          <button
            className={styles.controlButton}
            type="button"
            aria-label="Previous screenshot"
            disabled={!hasMultipleImages || !navigation.previous}
            onClick={() => {
              if (navigation.previous) {
                onActiveImageChange(navigation.previous.id);
              }
            }}
          >
            Previous
          </button>
          <div className={styles.zoomControls} aria-label="Zoom controls">
            <button
              className={styles.controlButton}
              type="button"
              aria-label="Zoom out"
              disabled={zoom !== "fit" && zoom === zoomLevels[0]}
              onClick={() => setZoom((value) => previousZoom(value))}
            >
              -
            </button>
            <button
              className={styles.controlButton}
              type="button"
              aria-label="Reset zoom"
              onClick={() => setZoom("fit")}
            >
              {zoomLabel(zoom)}
            </button>
            <button
              className={styles.controlButton}
              type="button"
              aria-label="Zoom in"
              disabled={zoom === zoomLevels[zoomLevels.length - 1]}
              onClick={() => setZoom((value) => nextZoom(value))}
            >
              +
            </button>
          </div>
          <button
            className={styles.controlButton}
            type="button"
            aria-label="Next screenshot"
            disabled={!hasMultipleImages || !navigation.next}
            onClick={() => {
              if (navigation.next) {
                onActiveImageChange(navigation.next.id);
              }
            }}
          >
            Next
          </button>
        </div>

        <div className={styles.viewport}>
          <img
            className={zoom === "fit" ? styles.imageFit : styles.imageZoomed}
            style={zoom === "fit" ? undefined : { width: `${zoom * 100}%` }}
            src={activeImage.src}
            alt={activeImage.alt}
          />
        </div>
      </section>
    </div>
  );
};
