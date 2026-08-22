import { PrismaClient } from "@prisma/client";
import { writeActivityLog } from "../../utils/activityLog";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  try {
    // An id that names an existing row is an update; anything else creates.
    const existing = body.id
      ? await prisma.organisation.findUnique({ where: { id: body.id }, select: { id: true } })
      : null;

    const organisation = await prisma.organisation.upsert({
      where: {
        id: body?.id || "",
      },
      create: {
        name: body.name,
        logo: body.logo,
        website: body.website,
        email: body.email,
        phoneNumber: body.phoneNumber,
        address: body.address,
      },
      update: {
        name: body.name,
        logo: body.logo,
        website: body.website,
        email: body.email,
        phoneNumber: body.phoneNumber,
        address: body.address,
      },
    });
    await writeActivityLog(event, {
      action: existing ? "UPDATE" : "CREATE",
      entityType: "ORGANISATION",
      entityId: organisation.id,
      summary: `${existing ? "Updated" : "Created"} organisation ${body.name}`,
    });
    return { organisation };
  } catch (error) {
    console.error(error);
    return { error: "Failed to upsert organisation" };
  }
});
