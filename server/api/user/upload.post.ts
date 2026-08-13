import { getServerSession } from "#auth";
import { readFiles } from "h3-formidable";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

/**
 * Uploads an image or document into `public/uploads`.
 *
 * The previous version derived the extension from the client-supplied filename
 * or MIME type and wrote it straight into the public web root, so a caller
 * could land a `.html` (stored XSS) or any other type there. Uploads are now
 * restricted to a fixed extension allowlist, capped in size, and given a
 * server-generated filename.
 *
 * Response shape is unchanged — `{ 0: "uploads/<name>.<ext>" }` — because
 * callers read it as `image[0]`.
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 10;

/** mime → extension. Anything not listed here is rejected. */
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/pjpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};

const UPLOAD_DIR = path.resolve(process.cwd(), "public", "uploads");

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: "Unauthenticated" });
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  let files: Record<string, any[]>;
  try {
    ({ files } = await readFiles(event, {
      maxFiles: MAX_FILES,
      maxFileSize: MAX_FILE_SIZE,
      filter: ({ mimetype }: { mimetype?: string | null }) =>
        !!mimetype && mimetype in ALLOWED,
    }));
  } catch {
    throw createError({
      statusCode: 413,
      statusMessage: `Upload rejected (max ${MAX_FILE_SIZE / 1024 / 1024}MB per file)`,
    });
  }

  const written: string[] = [];

  try {
    for (const key of Object.keys(files)) {
      const file = files[key]?.[0];
      if (!file) continue;

      const ext = file.mimetype ? ALLOWED[file.mimetype] : undefined;
      if (!ext) {
        throw createError({
          statusCode: 415,
          statusMessage: `Unsupported file type: ${file.mimetype ?? "unknown"}`,
        });
      }

      // Server-generated name: nothing from the client reaches the filesystem.
      const name = `${crypto.randomUUID()}.${ext}`;
      await fs.copyFile(file.filepath, path.join(UPLOAD_DIR, name));
      written.push(`uploads/${name}`);
    }

    if (written.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "No acceptable file was uploaded",
      });
    }

    setResponseStatus(event, 201);
    return { ...written };
  } catch (e: any) {
    // Don't leave half-written files behind on failure.
    await Promise.all(
      written.map((rel) =>
        fs.unlink(path.join(process.cwd(), "public", rel)).catch(() => {})
      )
    );
    if (e?.statusCode) throw e;
    console.error("[user/upload]", e);
    throw createError({ statusCode: 500, statusMessage: "Upload failed" });
  }
});
