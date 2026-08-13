import { getServerSession } from "#auth";
import fs from "fs/promises";
import { resolveUploadPath } from "../../utils/uploads";

/**
 * Deletes a previously uploaded file.
 *
 * This used to be:
 *
 *   let newPath = body?.imgURL;
 *   fs.unlink("public/" + newPath, () => { … });
 *
 * with no validation at all, so `{ imgURL: "../nuxt.config.ts" }` deleted
 * arbitrary files the server process could reach. `resolveUploadPath` now
 * confirms the target sits inside `public/uploads` before anything is removed.
 */
export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: "Unauthenticated" });
  }

  const body = await readBody(event);
  const target = resolveUploadPath(body?.imgURL);

  if (!target) {
    console.warn(`[deleteFile] rejected path: ${String(body?.imgURL)}`);
    throw createError({ statusCode: 400, statusMessage: "Invalid path" });
  }

  try {
    await fs.unlink(target);
    setResponseStatus(event, 204);
    return null;
  } catch (e: any) {
    if (e?.code === "ENOENT") {
      // Already gone — the caller's intent is satisfied.
      setResponseStatus(event, 204);
      return null;
    }
    console.error("[deleteFile]", e);
    throw createError({ statusCode: 500, statusMessage: "Delete failed" });
  }
});
