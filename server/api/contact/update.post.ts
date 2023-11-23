import { getServerSession } from "#auth";
import { firestore } from "~/server/utils/firebase";

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  const body = await readBody(event);

  if (!session) {
    return { status: "unauthenticated" };
  }

  try {
    await event.context.prisma.contactMessage.update({
      where: {
        id: body?.id,
      },
      data: {
        read: true,
      },
    });
    let docs = firestore
      .collection("message")
      .where("messageID", "==", body?.id);
    console.log("doc ID", body?.id);
    docs.get().then((querySnapshot) => {
      querySnapshot.docs.forEach(async (doc) => {
        console.log("doc inside ID", doc.id);
        await firestore.doc(`/message/${doc.id}`).update({
          read: true,
        });
      });
    });

    setResponseStatus(event, 201);
    return { message: "delete success" };
  } catch (e) {
    setResponseStatus(event, 502);
    return {
      error: "e",
    };
  }
});
