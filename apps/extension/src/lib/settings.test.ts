import { beforeEach, describe, expect, it } from "vitest";
import {
  clearSettings,
  getSettings,
  saveInstanceUrl,
  saveSelectedProjectId,
  saveSessionToken,
  type ExtensionStorageArea,
} from "./settings";

const createStorage = (): ExtensionStorageArea & { values: Record<string, unknown> } => {
  const values: Record<string, unknown> = {};

  return {
    values,
    get: async (keys) => {
      if (Array.isArray(keys)) {
        return Object.fromEntries(keys.map((key) => [key, values[key]]));
      }

      return { ...values };
    },
    set: async (items) => {
      Object.assign(values, items);
    },
    remove: async (keys) => {
      for (const key of Array.isArray(keys) ? keys : [keys]) {
        delete values[key];
      }
    },
  };
};

let storage: ReturnType<typeof createStorage>;

beforeEach(() => {
  storage = createStorage();
});

describe("extension settings", () => {
  it("returns null defaults when no settings are stored", async () => {
    await expect(getSettings(storage)).resolves.toEqual({
      instanceUrl: null,
      sessionToken: null,
      selectedProjectId: null,
    });
  });

  it("saves instance URL and clears session/project state", async () => {
    await saveSessionToken(storage, "token_1");
    await saveSelectedProjectId(storage, "project_1");

    await saveInstanceUrl(storage, "https://demo.example.com");

    await expect(getSettings(storage)).resolves.toEqual({
      instanceUrl: "https://demo.example.com",
      sessionToken: null,
      selectedProjectId: null,
    });
  });

  it("saves and clears session/project settings", async () => {
    await saveInstanceUrl(storage, "https://demo.example.com");
    await saveSessionToken(storage, "session-token");
    await saveSelectedProjectId(storage, "project_1");

    await expect(getSettings(storage)).resolves.toEqual({
      instanceUrl: "https://demo.example.com",
      sessionToken: "session-token",
      selectedProjectId: "project_1",
    });

    await clearSettings(storage);

    await expect(getSettings(storage)).resolves.toEqual({
      instanceUrl: null,
      sessionToken: null,
      selectedProjectId: null,
    });
  });
});
