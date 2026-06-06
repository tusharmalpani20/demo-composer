import { beforeEach, describe, expect, it } from "vitest";
import {
  clearSettings,
  getSettings,
  saveActiveCapture,
  saveActiveCaptureEventIndex,
  saveInstanceUrl,
  saveSelectedProjectId,
  saveSessionToken,
  clearActiveCapture,
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
      activeCaptureSessionId: null,
      activeCaptureProjectId: null,
      activeCaptureEventIndex: null,
    });
  });

  it("saves instance URL and clears session/project state", async () => {
    await saveSessionToken(storage, "token_1");
    await saveSelectedProjectId(storage, "project_1");
    await saveActiveCapture(storage, {
      captureSessionId: "capture_session_1",
      projectId: "project_1",
    });

    await saveInstanceUrl(storage, "https://demo.example.com");

    await expect(getSettings(storage)).resolves.toEqual({
      instanceUrl: "https://demo.example.com",
      sessionToken: null,
      selectedProjectId: null,
      activeCaptureSessionId: null,
      activeCaptureProjectId: null,
      activeCaptureEventIndex: null,
    });
  });

  it("clears active capture when the session token is cleared", async () => {
    await saveInstanceUrl(storage, "https://demo.example.com");
    await saveSessionToken(storage, "session-token");
    await saveSelectedProjectId(storage, "project_1");
    await saveActiveCapture(storage, {
      captureSessionId: "capture_session_1",
      projectId: "project_1",
    });

    await saveSessionToken(storage, null);

    await expect(getSettings(storage)).resolves.toEqual({
      instanceUrl: "https://demo.example.com",
      sessionToken: null,
      selectedProjectId: "project_1",
      activeCaptureSessionId: null,
      activeCaptureProjectId: null,
      activeCaptureEventIndex: null,
    });
  });

  it("saves and clears active capture without clearing selected project", async () => {
    await saveInstanceUrl(storage, "https://demo.example.com");
    await saveSessionToken(storage, "session-token");
    await saveSelectedProjectId(storage, "project_1");
    await saveActiveCapture(storage, {
      captureSessionId: "capture_session_1",
      projectId: "project_1",
    });

    await expect(getSettings(storage)).resolves.toEqual({
      instanceUrl: "https://demo.example.com",
      sessionToken: "session-token",
      selectedProjectId: "project_1",
      activeCaptureSessionId: "capture_session_1",
      activeCaptureProjectId: "project_1",
      activeCaptureEventIndex: 0,
    });

    await saveActiveCaptureEventIndex(storage, 3);

    await expect(getSettings(storage)).resolves.toEqual({
      instanceUrl: "https://demo.example.com",
      sessionToken: "session-token",
      selectedProjectId: "project_1",
      activeCaptureSessionId: "capture_session_1",
      activeCaptureProjectId: "project_1",
      activeCaptureEventIndex: 3,
    });

    await clearActiveCapture(storage);

    await expect(getSettings(storage)).resolves.toEqual({
      instanceUrl: "https://demo.example.com",
      sessionToken: "session-token",
      selectedProjectId: "project_1",
      activeCaptureSessionId: null,
      activeCaptureProjectId: null,
      activeCaptureEventIndex: null,
    });
  });

  it("clears all stored settings", async () => {
    await saveInstanceUrl(storage, "https://demo.example.com");
    await saveSessionToken(storage, "session-token");
    await saveSelectedProjectId(storage, "project_1");
    await saveActiveCapture(storage, {
      captureSessionId: "capture_session_1",
      projectId: "project_1",
    });

    await clearSettings(storage);

    await expect(getSettings(storage)).resolves.toEqual({
      instanceUrl: null,
      sessionToken: null,
      selectedProjectId: null,
      activeCaptureSessionId: null,
      activeCaptureProjectId: null,
      activeCaptureEventIndex: null,
    });
  });

  it("ignores invalid stored active capture event indexes", async () => {
    storage.values.activeCaptureEventIndex = -1;

    await expect(getSettings(storage)).resolves.toEqual({
      instanceUrl: null,
      sessionToken: null,
      selectedProjectId: null,
      activeCaptureSessionId: null,
      activeCaptureProjectId: null,
      activeCaptureEventIndex: null,
    });
  });

  it("rejects invalid active capture event indexes when saving", async () => {
    await expect(saveActiveCaptureEventIndex(storage, -1)).rejects.toThrow("Active capture event index must be a non-negative integer.");
    await expect(saveActiveCaptureEventIndex(storage, 1.5)).rejects.toThrow("Active capture event index must be a non-negative integer.");
  });

  it("rejects invalid active capture event indexes when starting capture", async () => {
    await expect(saveActiveCapture(storage, {
      captureSessionId: "capture_session_1",
      projectId: "project_1",
      eventIndex: -1,
    })).rejects.toThrow("Active capture event index must be a non-negative integer.");
  });
});
