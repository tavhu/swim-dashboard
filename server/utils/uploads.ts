import path from "path";

/**
 * Path handling for `public/uploads`, kept pure and separate so the traversal
 * rules can be unit-tested.
 *
 * `/api/deleteFile` did `fs.unlink("public/" + body.imgURL)` with no
 * validation, so a request body of `../server/api/auth/[...].ts` — or anything
 * else — deleted arbitrary files the server process could reach.
 */

export const PUBLIC_DIR = "public";
export const UPLOAD_SUBDIR = "uploads";

export function uploadRoot(cwd: string = process.cwd()): string {
  return path.resolve(cwd, PUBLIC_DIR, UPLOAD_SUBDIR);
}

/**
 * Resolve a client-supplied path to an absolute path inside `public/uploads`,
 * or return null if it is unacceptable.
 *
 * Accepted forms — the shapes the upload endpoint returns and the forms store:
 *   - `uploads/abc.png`   (canonical)
 *   - `/uploads/abc.png`  (site-relative URL)
 *   - `abc.png`           (bare filename)
 *   - Windows separators in any of the above
 *
 * Everything else is refused, and the resolved path is checked for containment
 * regardless — so even an accepted form cannot escape the uploads directory.
 */
export function resolveUploadPath(
  input: unknown,
  cwd: string = process.cwd()
): string | null {
  if (typeof input !== "string" || input.length === 0) return null;
  if (input.includes("\0")) return null;

  // Windows drive-qualified paths (`C:\...`, `C:/...`) are never valid here.
  if (/^[a-zA-Z]:[\\/]/.test(input)) return null;

  // Normalise separators, then drop leading slashes so `/uploads/x.png` and
  // `uploads/x.png` are treated the same.
  const normalised = input.replace(/\\/g, "/").replace(/^\/+/, "");
  if (normalised.length === 0) return null;

  let candidate: string;
  if (normalised.startsWith(`${UPLOAD_SUBDIR}/`)) {
    candidate = normalised;
  } else if (!normalised.includes("/")) {
    // Bare filename — assume it lives in uploads/.
    candidate = `${UPLOAD_SUBDIR}/${normalised}`;
  } else {
    // A multi-segment path that isn't under uploads/ (e.g. `../.env`,
    // `etc/passwd`). Refuse rather than try to interpret it.
    return null;
  }

  const root = uploadRoot(cwd);
  const target = path.resolve(cwd, PUBLIC_DIR, candidate);

  // The decisive check: after resolution the path must still be strictly
  // inside the uploads directory.
  const rel = path.relative(root, target);
  if (rel === "" || rel.startsWith("..") || path.isAbsolute(rel)) return null;

  return target;
}
