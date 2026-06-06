type ChromeTabsApi = {
  tabs?: {
    create?: (input: { url: string }, callback?: () => void) => void;
  };
  runtime?: {
    lastError?: {
      message?: string;
    };
  };
};

export const openPortalUrl = async (url: string): Promise<void> => {
  const chromeApi = (globalThis as { chrome?: ChromeTabsApi }).chrome;

  if (chromeApi?.tabs?.create) {
    await new Promise<void>((resolve, reject) => {
      chromeApi.tabs?.create?.({ url }, () => {
        const lastError = chromeApi.runtime?.lastError;

        if (lastError) {
          reject(new Error(lastError.message ?? "Could not open portal URL."));
          return;
        }

        resolve();
      });
    });
    return;
  }

  if (typeof globalThis.open === "function") {
    const opened = globalThis.open(url, "_blank", "noopener,noreferrer");

    if (opened === null) {
      throw new Error("Could not open portal URL.");
    }

    return;
  }

  throw new Error("Could not open portal URL.");
};
