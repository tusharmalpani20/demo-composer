import { Readable } from "node:stream";
import { describe, expect, it } from "vitest";
import { build_guide_zip_export } from "./guide-zip-export";

const read_stream = async (stream: NodeJS.ReadableStream) => {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
};

describe("guide ZIP export", () => {
  it("packages index HTML and image assets into a ZIP archive", async () => {
    const export_zip = await build_guide_zip_export({
      html: "<!doctype html><html><body>Guide</body></html>",
      images: [{
        path: "assets/1-screenshot.png",
        stream: Readable.from(Buffer.from("image-bytes")),
      }],
    });

    const JSZip = (await import("jszip")).default;
    const archive = await JSZip.loadAsync(await read_stream(export_zip.stream));

    await expect(archive.file("index.html")?.async("string"))
      .resolves.toBe("<!doctype html><html><body>Guide</body></html>");
    await expect(archive.file("assets/1-screenshot.png")?.async("string"))
      .resolves.toBe("image-bytes");
    expect(export_zip.mime_type).toBe("application/zip");
    expect(export_zip.size_bytes).toBeGreaterThan(0);
  });
});
