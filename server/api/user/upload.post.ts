import { readFiles } from 'h3-formidable';
import fs from "fs";
import path from "path";

export default defineEventHandler(async (event) => {

    

    const { files: { photo: [ { filepath, mimetype } ] } } = await readFiles(event, {
        //@ts-ignore
         includeFields: true
    });

    console.log(filepath)

    let imageName = String(Date.now()) + String(Math.round(Math.random() * 10000000));
    let newPath = `${path.join("public", "uploads", imageName)}.${ mimetype.split('/')[1] }`;

    fs.copyFileSync(filepath, newPath);

    return { success: true }

    
});