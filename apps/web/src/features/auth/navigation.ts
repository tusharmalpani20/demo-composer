export const currentBrowserPath = () => `${window.location.pathname}${window.location.search}`;

export const safeNextPath = (value: string | null | undefined) => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
};

export const signInUrl = (nextPath: string) => (
  `/login?next=${encodeURIComponent(safeNextPath(nextPath))}`
);
