export type CurrentTabSnapshot = {
  url: string | null;
  title: string | null;
};

type ChromeTabsApi = {
  tabs?: {
    query?: (queryInfo: {
      active: boolean;
      currentWindow: boolean;
    }) => Promise<Array<{
      url?: string;
      title?: string;
    }>>;
  };
};

const safeWebUrl = (url: string | undefined) => {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
};

const trimmedStringOrNull = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export const getCurrentTabSnapshot = async (): Promise<CurrentTabSnapshot> => {
  const chromeApi = (globalThis as { chrome?: ChromeTabsApi }).chrome;
  const query = chromeApi?.tabs?.query;

  if (!query) {
    return {
      url: null,
      title: null,
    };
  }

  const [tab] = await query({
    active: true,
    currentWindow: true,
  });

  return {
    url: safeWebUrl(tab?.url),
    title: trimmedStringOrNull(tab?.title),
  };
};
