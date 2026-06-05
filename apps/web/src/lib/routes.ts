export type PortalRoute =
  | {
    type: "capture_session_detail";
    projectId: string;
    captureSessionId: string;
  }
  | {
    type: "guide_detail";
    projectId: string;
    guideId: string;
  }
  | {
    type: "unsupported";
  };

export const parsePortalRoute = (pathname: string): PortalRoute => {
  const segments = pathname.split("/").filter(Boolean);

  if (
    segments.length === 4
    && segments[0] === "projects"
    && segments[2] === "capture-sessions"
  ) {
    const projectId = segments[1];
    const captureSessionId = segments[3];

    if (!projectId || !captureSessionId) {
      return { type: "unsupported" };
    }

    return {
      type: "capture_session_detail",
      projectId: decodeURIComponent(projectId),
      captureSessionId: decodeURIComponent(captureSessionId),
    };
  }

  if (
    segments.length === 4
    && segments[0] === "projects"
    && segments[2] === "guides"
  ) {
    const projectId = segments[1];
    const guideId = segments[3];

    if (!projectId || !guideId) {
      return { type: "unsupported" };
    }

    return {
      type: "guide_detail",
      projectId: decodeURIComponent(projectId),
      guideId: decodeURIComponent(guideId),
    };
  }

  return { type: "unsupported" };
};
