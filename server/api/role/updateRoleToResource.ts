import { getServerSession } from "#auth";

export default eventHandler(async  event => {
    const session = await getServerSession(event)
    const body =  await readBody(event)

    // console.log(body)    
    if(!session){
        return { status: 'unauthenticated'}
    }    
      
    try {

        await event.context.prisma.roleToResource.upsert({
            where : {
                 roleID_resourceID :{                   
                    resourceID : body?.resourceID,
                    roleID : body?.roleID
                  }
            },
            update :{
                granted : body?.granted
            },
            create :{                
                roleID : body?.roleID,
                resourceID : body?.resourceID,
                granted : body?.granted ,
            }
        })

        setResponseStatus(event, 201)    
         return { message: "Role to Resource Created" }
    }catch(e){  
        setResponseStatus(event, 412)    
        return {
            error  : 'e',
        }
    }
   
})


