export type ExtensionSettings = {
  instanceUrl: string | null;
  portalUrl?: string | null;
  sessionToken: string | null;
  selectedProjectId: string | null;
  activeCaptureSessionId: string | null;
  activeCaptureProjectId: string | null;
  activeCaptureEventIndex: number | null;
  activeCaptureMode: "manual" | "automatic" | null;
  activeCapturePaused: boolean;
};

export type ExtensionStorageArea = {
  get: (keys?: string | string[] | Record<string, unknown> | null) => Promise<Record<string, unknown>>;
  set: (items: Record<string, unknown>) => Promise<void>;
  remove: (keys: string | string[]) => Promise<void>;
};

const keys = {
  instanceUrl: "instanceUrl",
  portalUrl: "portalUrl",
  sessionToken: "sessionToken",
  selectedProjectId: "selectedProjectId",
  activeCaptureSessionId: "activeCaptureSessionId",
  activeCaptureProjectId: "activeCaptureProjectId",
  activeCaptureEventIndex: "activeCaptureEventIndex",
  activeCaptureMode: "activeCaptureMode",
  activeCapturePaused: "activeCapturePaused",
} as const;

const default_settings: ExtensionSettings = {
  instanceUrl: null,
  portalUrl: null,
  sessionToken: null,
  selectedProjectId: null,
  activeCaptureSessionId: null,
  activeCaptureProjectId: null,
  activeCaptureEventIndex: null,
  activeCaptureMode: null,
  activeCapturePaused: false,
};

const stringOrNull = (value: unknown) => (
  typeof value === "string" && value.trim() ? value : null
);

const nonNegativeIntegerOrNull = (value: unknown) => (
  typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null
);

const activeCaptureModeOrNull = (value: unknown) => (
  value === "manual" || value === "automatic" ? value : null
);

const booleanOrFalse = (value: unknown) => value === true;

const assertNonNegativeInteger = (value: number) => {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error("Active capture event index must be a non-negative integer.");
  }
};

const assertActiveCaptureMode = (value: "manual" | "automatic") => {
  if (value !== "manual" && value !== "automatic") {
    throw new Error("Active capture mode is invalid.");
  }
};

export const chromeLocalStorage = (): ExtensionStorageArea => {
  const chromeStorage = (globalThis as {
    chrome?: {
      storage?: {
        local?: ExtensionStorageArea;
      };
    };
  }).chrome?.storage?.local;

  if (!chromeStorage) {
    return {
      get: async () => ({}),
      set: async () => {},
      remove: async () => {},
    };
  }

  return chromeStorage;
};

export const getSettings = async (
  storage: ExtensionStorageArea = chromeLocalStorage()
): Promise<ExtensionSettings> => {
  const stored = await storage.get(Object.values(keys));

  return {
    instanceUrl: stringOrNull(stored[keys.instanceUrl]),
    portalUrl: stringOrNull(stored[keys.portalUrl]),
    sessionToken: stringOrNull(stored[keys.sessionToken]),
    selectedProjectId: stringOrNull(stored[keys.selectedProjectId]),
    activeCaptureSessionId: stringOrNull(stored[keys.activeCaptureSessionId]),
    activeCaptureProjectId: stringOrNull(stored[keys.activeCaptureProjectId]),
    activeCaptureEventIndex: nonNegativeIntegerOrNull(stored[keys.activeCaptureEventIndex]),
    activeCaptureMode: activeCaptureModeOrNull(stored[keys.activeCaptureMode]),
    activeCapturePaused: booleanOrFalse(stored[keys.activeCapturePaused]),
  };
};

export const saveInstanceUrl = async (
  storage: ExtensionStorageArea,
  instanceUrl: string
) => {
  await storage.set({
    [keys.instanceUrl]: instanceUrl,
    [keys.portalUrl]: null,
    [keys.sessionToken]: null,
    [keys.selectedProjectId]: null,
    [keys.activeCaptureSessionId]: null,
    [keys.activeCaptureProjectId]: null,
    [keys.activeCaptureEventIndex]: null,
    [keys.activeCaptureMode]: null,
    [keys.activeCapturePaused]: false,
  });
};

export const savePortalUrl = async (
  storage: ExtensionStorageArea,
  portalUrl: string | null
) => {
  await storage.set({ [keys.portalUrl]: portalUrl });
};

export const saveSessionToken = async (
  storage: ExtensionStorageArea,
  sessionToken: string | null
) => {
  await storage.set({
    [keys.sessionToken]: sessionToken,
    ...(sessionToken === null ? {
      [keys.activeCaptureSessionId]: null,
      [keys.activeCaptureProjectId]: null,
      [keys.activeCaptureEventIndex]: null,
      [keys.activeCaptureMode]: null,
      [keys.activeCapturePaused]: false,
    } : {}),
  });
};

export const saveSelectedProjectId = async (
  storage: ExtensionStorageArea,
  selectedProjectId: string | null
) => {
  await storage.set({ [keys.selectedProjectId]: selectedProjectId });
};

export const saveActiveCapture = async (
  storage: ExtensionStorageArea,
  input: {
    captureSessionId: string;
    projectId: string;
    eventIndex?: number;
    mode?: "manual" | "automatic";
  }
) => {
  const eventIndex = input.eventIndex ?? 0;
  const mode = input.mode ?? "manual";
  assertNonNegativeInteger(eventIndex);
  assertActiveCaptureMode(mode);

  await storage.set({
    [keys.activeCaptureSessionId]: input.captureSessionId,
    [keys.activeCaptureProjectId]: input.projectId,
    [keys.activeCaptureEventIndex]: eventIndex,
    [keys.activeCaptureMode]: mode,
    [keys.activeCapturePaused]: false,
  });
};

export const saveActiveCaptureEventIndex = async (
  storage: ExtensionStorageArea,
  eventIndex: number
) => {
  assertNonNegativeInteger(eventIndex);
  await storage.set({ [keys.activeCaptureEventIndex]: eventIndex });
};

export const saveActiveCaptureMode = async (
  storage: ExtensionStorageArea,
  input: {
    mode: "manual" | "automatic";
    paused: boolean;
  }
) => {
  assertActiveCaptureMode(input.mode);
  await storage.set({
    [keys.activeCaptureMode]: input.mode,
    [keys.activeCapturePaused]: input.paused,
  });
};

export const clearActiveCapture = async (
  storage: ExtensionStorageArea = chromeLocalStorage()
) => {
  await storage.set({
    [keys.activeCaptureSessionId]: null,
    [keys.activeCaptureProjectId]: null,
    [keys.activeCaptureEventIndex]: null,
    [keys.activeCaptureMode]: null,
    [keys.activeCapturePaused]: false,
  });
};

export const clearSettings = async (
  storage: ExtensionStorageArea = chromeLocalStorage()
) => {
  await storage.remove(Object.values(keys));
};

export const emptySettings = () => ({ ...default_settings });
