import { getServerSession } from "#auth";
import fs from "fs";

// import path from "path";

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  const body = await readBody(event);

  if (!session) {
    return { status: "unauthenticated" };
  }
  try {
    let newPath = body?.imgURL; //`${path.join("public", "uploads", '671d1852a3454254b5a470f00.jpeg')}`;
    fs.unlink("public/" + newPath, () => {
      setResponseStatus(event, 412);
    });
    setResponseStatus(event, 201);
  } catch (e) {
    console.log(e);
    setResponseStatus(event, 412);
    return {
      error: e,
    };
  }
});
