/**
 * Mark one មតិយោបល់ as dealt with, or put it back.
 *
 * Write on `feedback-list`, so read-only on that row means exactly that: you can
 * see what people have said and not change its state under the reader who is
 * actually working through it.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const id: unknown = body?.id;

  if (typeof id !== "string" || !id) {
    setResponseStatus(event, 400);
    return { error: "id is required" };
  }

  await event.context.prisma.feedback.update({
    where: { id },
    data: { handled: body?.handled !== false },
  });
  return { message: "ok" };
});
