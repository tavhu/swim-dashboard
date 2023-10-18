import { getServerSession } from "#auth";
import { readFiles } from 'h3-formidable'
import fs from "fs";
import path from "path";

export default eventHandler(async event => {
  const session = await getServerSession(event)    
    if(!session){
      return { status: 'unauthenticated'}
  }    
    //event.context.formidable coming from server middleware formidable.ts
    // const { files } = event.context.formidable;
    const FilePath = []
    const { files } = await readFiles(event, {})

    for (const key in files) {
      if (Object.hasOwn(files, key)) {
        const data = files[key][0];      
        let newPath = `${path.join("public", "uploads", data.newFilename)}.${ data.mimetype.split('/')[1] }`;        
        // console.log(data.filepath,newPath)
        try {
          fs.copyFileSync(data.filepath, newPath);              
          FilePath.push(newPath.replace('public/','').replace('public\\',''))
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