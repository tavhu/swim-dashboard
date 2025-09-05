import { getServerSession } from "#auth";
import { readFiles } from "h3-formidable";
import fs from "fs";
import path from "path";

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session) {
    return { status: "unauthenticated" };
  }

  const FilePath = [];
  const { files } = await readFiles(event, {});

  for (const key in files) {
    if (Object.hasOwn(files, key)) {
      const data = files[key][0];

      // Extract file extension safely
      const fileExtension =
        path.extname(data.originalFilename) || data.mimetype.split("/")[1];
      const sanitizedExtension = fileExtension.replace(/[^a-zA-Z0-9]/g, ""); // Remove unwanted characters

      // Construct new file path
      const newPath = `${path.join(
        "public",
        "uploads",
        data.newFilename
      )}.${sanitizedExtension}`;

      try {
        // Copy file to new path
        fs.copyFileSync(data.filepath, newPath);
        FilePath.push(newPath.replace("public/", "").replace("public\\", ""));
      } catch (e) {
        console.log(e);
        setResponseStatus(event, 412);
        return {
          error: e,
        };
      }
    }
  }

  return { ...FilePath };
});
