import { Readable } from "node:stream";
import JSZip from "jszip";

export type GuideZipExportInput = {
  html: string;
  images: Array<{
    path: string;
    stream: NodeJS.ReadableStream;
  }>;
};

export type GuideZipExport = {
  mime_type: "application/zip";
  stream: NodeJS.ReadableStream;
  size_bytes: number;
};

const read_stream = async (stream: NodeJS.ReadableStream) => {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
};

export const build_guide_zip_export = async (
  input: GuideZipExportInput
): Promise<GuideZipExport> => {
  const archive = new JSZip();
  archive.file("index.html", input.html);

  for (const image of input.images) {
    archive.file(image.path, await read_stream(image.stream));
  }

  const buffer = await archive.generateAsync({
    compression: "DEFLATE",
    type: "nodebuffer",
  });

  return {
    mime_type: "application/zip",
    stream: Readable.from(buffer),
    size_bytes: buffer.byteLength,
  };
};
