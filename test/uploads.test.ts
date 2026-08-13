import { describe, expect, it } from "vitest";
import path from "path";
import { resolveUploadPath, uploadRoot } from "../server/utils/uploads";

/**
 * Regression tests for the `/api/deleteFile` traversal bug. Anything that
 * resolves outside `public/uploads` must come back null.
 */

const CWD = "/srv/app";
const ROOT = uploadRoot(CWD);

const isInsideRoot = (p: string) => {
  const rel = path.relative(ROOT, p);
  return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel);
};

describe("resolveUploadPath — accepts legitimate values", () => {
  it.each([
    "uploads/abc123.png",
    "/uploads/abc123.png",
    "uploads\\abc123.png",
    "abc123.png",
    "uploads/nested/abc123.jpg",
  ])("accepts %j", (input) => {
    const resolved = resolveUploadPath(input, CWD);
    expect(resolved).not.toBeNull();
    expect(isInsideRoot(resolved!)).toBe(true);
  });

  it("resolves to the expected absolute path", () => {
    expect(resolveUploadPath("uploads/abc.png", CWD)).toBe(
      path.resolve(CWD, "public/uploads/abc.png")
    );
    expect(resolveUploadPath("abc.png", CWD)).toBe(
      path.resolve(CWD, "public/uploads/abc.png")
    );
  });
});

describe("resolveUploadPath — rejects traversal and junk", () => {
  it.each([
    ["parent traversal", "../server/api/auth/index.ts"],
    ["traversal through uploads", "uploads/../../server/middleware/prisma.ts"],
    ["deep traversal", "../../../../etc/passwd"],
    ["backslash traversal", "..\\..\\.env"],
    ["mixed separators", "uploads/..\\..\\.env"],
    ["escaping to a sibling of uploads", "uploads/../avatars/x.png"],
    ["absolute posix path", "/etc/passwd"],
    ["absolute windows path", "C:\\Windows\\System32\\drivers\\etc\\hosts"],
    ["leading slashes then traversal", "///../.env"],
    ["null byte", "uploads/abc.png\0.txt"],
    ["empty string", ""],
    ["only slashes", "///"],
    ["the uploads dir itself", "uploads/"],
  ])("rejects %s", (_label, input) => {
    expect(resolveUploadPath(input, CWD)).toBeNull();
  });

  it.each([[null], [undefined], [42], [{}], [[]], [true]])(
    "rejects non-string input %j",
    (input) => {
      expect(resolveUploadPath(input as unknown, CWD)).toBeNull();
    }
  );

  it("never returns a path outside the uploads root", () => {
    for (const a of [
      "../.env",
      "../../.env",
      "uploads/../../.env",
      "./../../package.json",
      "uploads/./../../nuxt.config.ts",
    ]) {
      const resolved = resolveUploadPath(a, CWD);
      if (resolved !== null) {
        expect(isInsideRoot(resolved), `${a} escaped to ${resolved}`).toBe(true);
      }
    }
  });
});

describe("the fixed endpoints no longer contain the old patterns", () => {
  /**
   * Each fixed file quotes the old buggy code in a comment so the reason for
   * the change is visible. Strip comments before asserting, or the tests match
   * their own documentation.
   */
  const read = (f: string) =>
    require("fs")
      .readFileSync(path.resolve(__dirname, "..", f), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");

  it("deleteFile no longer concatenates the body into a path", () => {
    const src = read("server/api/deleteFile/index.post.ts");
    expect(src).toMatch(/resolveUploadPath/);
    expect(src).not.toMatch(/unlink\(\s*["']public\/["']\s*\+/);
  });

  it("/api/me no longer creates an admin account", () => {
    const src = read("server/api/me.ts");
    expect(src).not.toMatch(/hash\(\s*["']admin123["']/);
    expect(src).toMatch(/statusCode:\s*410/);
  });

  it("checkUsername selects fields rather than the whole row", () => {
    const src = read("server/api/user/checkUsername.post.ts");
    expect(src).toMatch(/PROFILE_FIELDS/);
    expect(src).not.toMatch(/password:\s*true/);
  });

  it("user/upsert no longer takes the role straight from the body", () => {
    // The old handler passed body.userRoleID into prisma unguarded.
    const src = read("server/api/user/upsert.post.ts");
    expect(src).toContain("assertCanAssignRole");
    expect(src).not.toMatch(/userRoleID\s*:\s*body\?\.\s*userRoleID/);
  });

  it("role/get no longer trusts ?userID=", () => {
    const src = read("server/api/role/get.get.ts");
    expect(src).not.toMatch(/userID\s*[:=]\s*body\?\.\s*userID/);
    expect(src).toContain("caller.roleId");
  });

  it("readRoleandResource takes the user id from the session", () => {
    const src = read("server/api/role/readRoleandResource.ts");
    expect(src).not.toMatch(/const\s+userID\s*=\s*body\?\.userID/);
    expect(src).toMatch(/session as any\)\?\.id/);
  });

  it("upload restricts extensions and generates the filename", () => {
    const src = read("server/api/user/upload.post.ts");
    expect(src).toMatch(/ALLOWED/);
    expect(src).toMatch(/crypto\.randomUUID/);
    expect(src).not.toMatch(/data\.mimetype\.split\(/);
  });
});
