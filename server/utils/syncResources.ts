import type { PrismaClient } from "@prisma/client";
import { APP_RESOURCES } from "./appResources";

/**
 * Brings the Resources table in line with APP_RESOURCES, and gives every role a
 * row for every resource.
 *
 * Two things this guarantees, both of which were untrue before:
 *
 *   1. Every page appears in the permission grid. Pages with no Resources row
 *      were not "denied" — they were ungated, because the route middleware only
 *      refuses a page it has a row for.
 *   2. Every (role, resource) pair has a RoleToResource row. A missing row reads
 *      as "no access" to `hasPermission`, which is the safe default, but it also
 *      means the grid cannot show the state or let anyone change it.
 *
 * Existing grants are never altered. A row that is already there keeps whatever
 * it was set to; only missing rows are created, denied by default — except for
 * `superAdminRoleName`, which gets write, since a Super Admin who cannot reach a
 * newly added page has no way to grant it to themselves.
 *
 * Role-gate rows (a Resources row whose frontEndURL is a role id) are left
 * alone: they are not pages and must not be swept up as ones.
 */
export async function syncResources(
  prisma: PrismaClient,
  opts: { superAdminRoleName?: string } = {}
) {
  const superAdminRoleName = opts.superAdminRoleName ?? "Super Admin";

  const created: string[] = [];
  const renamed: string[] = [];

  for (const r of APP_RESOURCES) {
    const existing = await prisma.resources.findFirst({
      where: { frontEndURL: r.route },
      select: { id: true, name: true },
    });
    if (!existing) {
      // `name` is unique, so a clash with an unrelated row has to be avoided.
      const clash = await prisma.resources.findUnique({
        where: { name: r.nameKh },
        select: { id: true },
      });
      const name = clash ? `${r.nameKh} (${r.route})` : r.nameKh;
      await prisma.resources.create({ data: { name, frontEndURL: r.route } });
      created.push(r.route);
    } else if (existing.name !== r.nameKh) {
      const clash = await prisma.resources.findFirst({
        where: { name: r.nameKh, NOT: { id: existing.id } },
        select: { id: true },
      });
      if (!clash) {
        await prisma.resources.update({ where: { id: existing.id }, data: { name: r.nameKh } });
        renamed.push(r.route);
      }
    }
  }

  const roles = await prisma.role.findMany({ select: { id: true, name: true } });
  const resources = await prisma.resources.findMany({
    where: { frontEndURL: { in: APP_RESOURCES.map((r) => r.route) } },
    select: { id: true, frontEndURL: true },
  });

  const existingLinks = await prisma.roleToResource.findMany({
    where: { resourceID: { in: resources.map((r) => r.id) } },
    select: { roleID: true, resourceID: true },
  });
  const have = new Set(existingLinks.map((l) => `${l.roleID}:${l.resourceID}`));

  const toCreate: { roleID: string; resourceID: string; granted: boolean; read: boolean }[] = [];
  for (const role of roles) {
    const isSuper = role.name === superAdminRoleName;
    for (const res of resources) {
      if (have.has(`${role.id}:${res.id}`)) continue;
      toCreate.push({
        roleID: role.id,
        resourceID: res.id,
        granted: isSuper,
        read: isSuper,
      });
    }
  }
  if (toCreate.length) {
    await prisma.roleToResource.createMany({ data: toCreate, skipDuplicates: true });
  }

  return {
    resourcesCreated: created,
    resourcesRenamed: renamed,
    linksCreated: toCreate.length,
    roles: roles.length,
    resources: resources.length,
  };
}

/**
 * Super Admin holds write on everything, always.
 *
 * Separate from the backfill above because it also repairs rows that already
 * exist — a Super Admin who has been accidentally denied a page cannot use the
 * permission screen to give it back if the permission screen is the page they
 * were denied.
 */
export async function ensureSuperAdminFullAccess(
  prisma: PrismaClient,
  superAdminRoleName = "Super Admin"
) {
  const role = await prisma.role.findFirst({
    where: { name: superAdminRoleName },
    select: { id: true },
  });
  if (!role) return { updated: 0 };

  const res = await prisma.resources.findMany({ select: { id: true } });
  const result = await prisma.roleToResource.updateMany({
    where: { roleID: role.id, resourceID: { in: res.map((r) => r.id) } },
    data: { granted: true, read: true },
  });
  return { updated: result.count };
}
