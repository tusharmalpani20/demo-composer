export const publicGuideUrl = (publicUrl: string, origin = window.location.origin) => {
  if (publicUrl.startsWith("/")) {
    return new URL(publicUrl, origin).toString();
  }

  return publicUrl;
};

export const publicGuideEmbedUrl = (publicUrl: string, origin = window.location.origin) => {
  const url = new URL(publicGuideUrl(publicUrl, origin));

  if (!url.pathname.endsWith("/embed")) {
    url.pathname = `${url.pathname.replace(/\/$/, "")}/embed`;
  }

  url.search = "";
  url.hash = "";

  return url.toString();
};

const escapeHtmlAttribute = (value: string) => (
  value
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
);

export const publicGuideEmbedCode = ({
  publicUrl,
  title,
  origin,
}: {
  publicUrl: string;
  title: string;
  origin?: string;
}) => {
  const src = escapeHtmlAttribute(publicGuideEmbedUrl(publicUrl, origin));
  const escapedTitle = escapeHtmlAttribute(title);

  return `<iframe src="${src}" title="${escapedTitle}" width="100%" height="720" loading="lazy" style="border:0;"></iframe>`;
};
