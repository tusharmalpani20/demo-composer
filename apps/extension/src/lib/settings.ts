export type ExtensionSettings = {
  instanceUrl: string | null;
  sessionToken: string | null;
  selectedProjectId: string | null;
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
} as const;

const default_settings: ExtensionSettings = {
  instanceUrl: null,
  sessionToken: null,
  selectedProjectId: null,
};

const stringOrNull = (value: unknown) => (
  typeof value === "string" && value.trim() ? value : null
);

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
  });
};

export const saveSessionToken = async (
  storage: ExtensionStorageArea,
  sessionToken: string | null
) => {
  await storage.set({ [keys.sessionToken]: sessionToken });
};

export const saveSelectedProjectId = async (
  storage: ExtensionStorageArea,
  selectedProjectId: string | null
) => {
  await storage.set({ [keys.selectedProjectId]: selectedProjectId });
};

export const clearSettings = async (
  storage: ExtensionStorageArea = chromeLocalStorage()
) => {
  await storage.remove(Object.values(keys));
};

export const emptySettings = () => ({ ...default_settings });
