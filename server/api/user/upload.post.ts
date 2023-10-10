import { getServerSession } from "#auth";
import fs from "fs";
import path from "path";

export default eventHandler(async event => {
  const session = await getServerSession(event)    
    if(!session){
      return { status: 'unauthenticated'}
  }    
    //event.context.formidable coming from server middleware formidable.ts
    const { files } = event.context.formidable;
    const FilePath = []

    for (const key in files) {
      if (Object.prototype.hasOwnProperty.call(files, key)) {
        const data = files[key][0];      
        let newPath = `${path.join("public", "uploads", data.newFilename)}.${ data.mimetype.split('/')[1] }`;        
        // console.log(data.filepath,newPath)
        try {
          fs.copyFileSync(data.filepath, newPath);     
          FilePath.push(newPath)
        }catch(e){
          console.log(e)
          setResponseStatus(event, 412)    
          return {
              error  : e,
          }
        }    
      }
    }

    return {  ...FilePath }    

});