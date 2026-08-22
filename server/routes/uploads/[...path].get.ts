import fs from "fs/promises";
import { resolveUploadPath } from "../../utils/uploads";

/**
 * Serves uploaded files at runtime.
 *
 * Nitro copies `public/` into `.output/public/` at BUILD time, so any file
 * uploaded after the last build is invisible to `/uploads/<name>` — the exact
 * bug this fixes. This handler streams straight from the live
 * `<cwd>/public/uploads` directory instead. Files that DO exist in the build
 * snapshot are served by the static handler first; this one only catches the
 * misses (and in dev, everything).
 *
 * Content-Type comes from the extension allowlist shared with the upload
 * endpoint, so nothing unexpected can be served.
 */
const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export default defineEventHandler(async (event) => {
  const rel = event.context.params?.path ?? "";
  const abs = resolveUploadPath(decodeURIComponent(rel));
  if (!abs) {
    throw createError({ statusCode: 400, statusMessage: "Bad path" });
  }

  try {
    const data = await fs.readFile(abs);
    const ext = abs.split(".").pop()?.toLowerCase() ?? "";
    setHeader(event, "Content-Type", MIME[ext] ?? "application/octet-stream");
    // Immutable names (uuid), safe to cache.
    setHeader(event, "Cache-Control", "public, max-age=31536000, immutable");
    return data;
  } catch {
    throw createError({ statusCode: 404, statusMessage: "Not found" });
  }
});
