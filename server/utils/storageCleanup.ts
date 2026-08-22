import fs from "fs/promises";
import path from "path";
import { resolveUploadPath } from "./uploads";

/**
 * Storage cleanup for replaced files.
 *
 * When an update swaps a photo or attachment list, the old files stay on disk
 * forever unless someone deletes them — the storage fills with files nothing
 * references. These helpers remove the old paths AFTER the new values are
 * committed, and never let a cleanup failure fail the save.
 *
 * Rules:
 *  - only paths that resolve inside public/uploads are touched
 *    (resolveUploadPath enforces this)
 *  - a path still referenced by the NEW value is kept (same file re-selected)
 *  - unlink errors are logged and swallowed: losing a stale file is better
 *    than rolling back a successful update
 */

/** Extract every upload path from a comma-separated attachment column. */
function splitList(value: unknown): string[] {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Delete old files that the new value no longer references.
 *
 * @param oldPaths single path or comma list from BEFORE the update
 * @param newPaths single path or comma list from AFTER the update
 */
export async function cleanupReplacedFiles(
  oldPaths: unknown,
  newPaths: unknown,
  tag = "[cleanup]"
): Promise<number> {
  const keep = new Set(splitList(newPaths));
  const gone = splitList(oldPaths).filter((p) => !keep.has(p));

  let removed = 0;
  for (const rel of gone) {
    const abs = resolveUploadPath(rel);
    if (!abs) continue;
    try {
      await fs.unlink(abs);
      removed++;
    } catch (e: any) {
      if (e?.code !== "ENOENT") {
        console.warn(`${tag} could not remove ${rel}:`, e?.message ?? e);
      }
    }
  }
  if (removed > 0) console.log(`${tag} removed ${removed} replaced file(s)`);
  return removed;
}

/** Convenience for single-image columns (photo, image). */
export async function cleanupReplacedFile(
  oldValue: unknown,
  newValue: unknown,
  tag = "[cleanup]"
): Promise<number> {
  return cleanupReplacedFiles(oldValue, newValue, tag);
}
