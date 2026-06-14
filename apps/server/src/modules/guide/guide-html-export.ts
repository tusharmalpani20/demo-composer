import type {
  GuideBlock,
  GuideDetail,
  GuideSourceCaptureAsset,
} from "./guide.service";

export type GuideHtmlExportImageReference = {
  capture_asset_id: string;
  asset_path: string;
  mime_type: string;
};

export type GuideHtmlExport = {
  html: string;
  image_references: GuideHtmlExportImageReference[];
};

const escape_html = (value: string) => (
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
);

const extension_for_mime_type = (mime_type: string) => {
  if (mime_type === "image/jpeg") {
    return "jpg";
  }

  if (mime_type === "image/webp") {
    return "webp";
  }

  if (mime_type === "image/gif") {
    return "gif";
  }

  return "png";
};

const percent = (value: number) => `${Number((value * 100).toFixed(4))}%`;

const html_paragraphs = (value: string) => (
  value
    .split(/\r?\n/)
    .map((line) => `<p>${escape_html(line)}</p>`)
    .join("\n")
);

const assets_by_id = (assets: GuideSourceCaptureAsset[]) => new Map(
  assets.map((asset) => [asset.id, asset])
);

const step_number_for_block = (blocks: GuideBlock[], block: GuideBlock) => (
  blocks
    .filter((candidate) => candidate.block_type === "step" && candidate.step)
    .sort((left, right) => left.block_index - right.block_index)
    .findIndex((candidate) => candidate.id === block.id) + 1
);

const image_path_for = (block: GuideBlock, asset: GuideSourceCaptureAsset) => (
  `assets/${block.block_index}-${asset.id}.${extension_for_mime_type(asset.file.mime_type)}`
);

const render_annotations = (block: GuideBlock) => {
  const annotations = block.content?.annotations ?? [];

  if (annotations.length === 0) {
    return "";
  }

  return annotations
    .filter((annotation) => annotation.type === "highlight")
    .map((annotation) => (
      `<span class="annotation annotation-highlight" style="left: ${percent(annotation.x)}; top: ${percent(annotation.y)}; width: ${percent(annotation.width)}; height: ${percent(annotation.height)};"></span>`
    ))
    .join("\n");
};

const render_step_image = (
  block: GuideBlock,
  asset: GuideSourceCaptureAsset | null
) => {
  if (!asset || block.screenshot_hidden) {
    return "";
  }

  const image_path = image_path_for(block, asset);
  const alt = asset.page_title ?? asset.file.original_name ?? block.step?.title ?? "Guide screenshot";
  const metadata = asset.page_url
    ? `<figcaption>${escape_html(asset.page_url)}</figcaption>`
    : "";

  return [
    "<figure class=\"step-screenshot\">",
    "<div class=\"screenshot-frame\">",
    `<img src="${escape_html(image_path)}" alt="${escape_html(alt)}">`,
    render_annotations(block),
    "</div>",
    metadata,
    "</figure>",
  ].filter(Boolean).join("\n");
};

const render_callout = (kind: "tip" | "alert", block: GuideBlock) => {
  const title = block.content?.title;
  const body = block.content?.body;
  const heading = title
    ? `<strong>${kind === "tip" ? "Tip" : "Alert"}: ${escape_html(title)}</strong>`
    : `<strong>${kind === "tip" ? "Tip" : "Alert"}</strong>`;

  return [
    `<aside class="guide-callout guide-callout-${kind}">`,
    heading,
    body ? html_paragraphs(body) : "",
    "</aside>",
  ].filter(Boolean).join("\n");
};

const render_block = (
  sorted_blocks: GuideBlock[],
  block: GuideBlock,
  asset_by_id: Map<string, GuideSourceCaptureAsset>
) => {
  if (block.block_type === "header" && block.content?.title) {
    return `<h2>${escape_html(block.content.title)}</h2>`;
  }

  if (block.block_type === "paragraph" && block.content?.body) {
    return `<section class="guide-block guide-paragraph">${html_paragraphs(block.content.body)}</section>`;
  }

  if (block.block_type === "tip") {
    return render_callout("tip", block);
  }

  if (block.block_type === "alert") {
    return render_callout("alert", block);
  }

  if (block.block_type === "divider") {
    return "<hr>";
  }

  if (block.block_type === "step" && block.step) {
    const step_number = step_number_for_block(sorted_blocks, block);
    const asset = block.display_capture_asset_id
      ? asset_by_id.get(block.display_capture_asset_id) ?? null
      : null;

    return [
      "<section class=\"guide-block guide-step\">",
      `<h2>${step_number}. ${escape_html(block.step.title)}</h2>`,
      block.step.body ? html_paragraphs(block.step.body) : "",
      render_step_image(block, asset),
      "</section>",
    ].filter(Boolean).join("\n");
  }

  return `<!-- Unsupported guide block: ${escape_html(block.block_type)} -->`;
};

const stylesheet = `
body {
  color: #1f2937;
  background: #f3f4f6;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  line-height: 1.55;
  margin: 0;
}
main {
  box-sizing: border-box;
  margin: 0 auto;
  max-width: 920px;
  padding: 48px 24px 72px;
}
.guide-block,
.guide-callout {
  margin: 28px 0;
}
.step-screenshot {
  margin: 18px 0 0;
}
.screenshot-frame {
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  position: relative;
}
.screenshot-frame img {
  border-radius: 8px;
  display: block;
  height: auto;
  width: 100%;
}
.annotation-highlight {
  border: 3px solid #f97316;
  border-radius: 999px;
  box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.2);
  box-sizing: border-box;
  pointer-events: none;
  position: absolute;
}
.guide-callout {
  border-left: 4px solid #2563eb;
  padding: 12px 16px;
}
.guide-callout-alert {
  border-left-color: #dc2626;
}
figcaption {
  color: #6b7280;
  font-size: 13px;
  margin-top: 8px;
}
`;

export const render_guide_html_export = (detail: GuideDetail): GuideHtmlExport => {
  const asset_by_id = assets_by_id(detail.source_capture_assets);
  const sorted_blocks = [...detail.guide_blocks].sort((left, right) => left.block_index - right.block_index);
  const image_references = sorted_blocks.flatMap((block) => {
    if (block.screenshot_hidden || !block.display_capture_asset_id) {
      return [];
    }

    const asset = asset_by_id.get(block.display_capture_asset_id);

    if (!asset) {
      return [];
    }

    return [{
      capture_asset_id: asset.id,
      asset_path: image_path_for(block, asset),
      mime_type: asset.file.mime_type,
    }];
  });

  const html = [
    "<!doctype html>",
    "<html lang=\"en\">",
    "<head>",
    "<meta charset=\"utf-8\">",
    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
    `<title>${escape_html(detail.guide.title)}</title>`,
    `<style>${stylesheet}</style>`,
    "</head>",
    "<body>",
    "<main>",
    `<h1>${escape_html(detail.guide.title)}</h1>`,
    detail.guide.description ? `<p class="guide-description">${escape_html(detail.guide.description)}</p>` : "",
    ...sorted_blocks.map((block) => render_block(sorted_blocks, block, asset_by_id)),
    "</main>",
    "</body>",
    "</html>",
  ].filter(Boolean).join("\n");

  return {
    html,
    image_references,
  };
};
