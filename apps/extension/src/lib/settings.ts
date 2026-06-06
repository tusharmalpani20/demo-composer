export type ExtensionSettings = {
  instanceUrl: string | null;
  sessionToken: string | null;
  selectedProjectId: string | null;
  activeCaptureSessionId: string | null;
  activeCaptureProjectId: string | null;
  activeCaptureEventIndex: number | null;
};

export type ExtensionStorageArea = {
  get: (keys?: string | string[] | Record<string, unknown> | null) => Promise<Record<string, unknown>>;
  set: (items: Record<string, unknown>) => Promise<void>;
  remove: (keys: string | string[]) => Promise<void>;
};

const keys = {
  instanceUrl: "instanceUrl",
  sessionToken: "sessionToken",
  selectedProjectId: "selectedProjectId",
  activeCaptureSessionId: "activeCaptureSessionId",
  activeCaptureProjectId: "activeCaptureProjectId",
  activeCaptureEventIndex: "activeCaptureEventIndex",
} as const;

const default_settings: ExtensionSettings = {
  instanceUrl: null,
  sessionToken: null,
  selectedProjectId: null,
  activeCaptureSessionId: null,
  activeCaptureProjectId: null,
  activeCaptureEventIndex: null,
};

const stringOrNull = (value: unknown) => (
  typeof value === "string" && value.trim() ? value : null
);

const nonNegativeIntegerOrNull = (value: unknown) => (
  typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null
);

const assertNonNegativeInteger = (value: number) => {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error("Active capture event index must be a non-negative integer.");
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
    sessionToken: stringOrNull(stored[keys.sessionToken]),
    selectedProjectId: stringOrNull(stored[keys.selectedProjectId]),
    activeCaptureSessionId: stringOrNull(stored[keys.activeCaptureSessionId]),
    activeCaptureProjectId: stringOrNull(stored[keys.activeCaptureProjectId]),
    activeCaptureEventIndex: nonNegativeIntegerOrNull(stored[keys.activeCaptureEventIndex]),
  };
};

export const saveInstanceUrl = async (
  storage: ExtensionStorageArea,
  instanceUrl: string
) => {
  await storage.set({
    [keys.instanceUrl]: instanceUrl,
    [keys.sessionToken]: null,
    [keys.selectedProjectId]: null,
    [keys.activeCaptureSessionId]: null,
    [keys.activeCaptureProjectId]: null,
    [keys.activeCaptureEventIndex]: null,
  });
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
  }
) => {
  const eventIndex = input.eventIndex ?? 0;
  assertNonNegativeInteger(eventIndex);

  await storage.set({
    [keys.activeCaptureSessionId]: input.captureSessionId,
    [keys.activeCaptureProjectId]: input.projectId,
    [keys.activeCaptureEventIndex]: eventIndex,
  });
};

export const saveActiveCaptureEventIndex = async (
  storage: ExtensionStorageArea,
  eventIndex: number
) => {
  assertNonNegativeInteger(eventIndex);
  await storage.set({ [keys.activeCaptureEventIndex]: eventIndex });
};

export const clearActiveCapture = async (
  storage: ExtensionStorageArea = chromeLocalStorage()
) => {
  await storage.set({
    [keys.activeCaptureSessionId]: null,
    [keys.activeCaptureProjectId]: null,
    [keys.activeCaptureEventIndex]: null,
  });
};

export const clearSettings = async (
  storage: ExtensionStorageArea = chromeLocalStorage()
) => {
  await storage.remove(Object.values(keys));
};

export const emptySettings = () => ({ ...default_settings });
