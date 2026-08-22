import { getServerSession } from "#auth";
import { writeActivityLog } from "../../utils/activityLog";


export default eventHandler(async  event => {
    const session = await getServerSession(event)
    const body =  await readBody(event)

    // console.log(body)    
    
    if(!session){
        return { status: 'unauthenticated'}
    }    
      
    try {
        const target = await event.context.prisma.user.findUnique({
            where: { id: body?.id },
            select: { username: true },
        });

        await event.context.prisma.user.delete({
            where : {
                id: body?.id
            }
        })

        await writeActivityLog(event, {
            action: "DELETE",
            entityType: "USER",
            entityId: body?.id,
            summary: `Deleted account ${target?.username ?? body?.id}`,
        });

        setResponseStatus(event, 201)    
         return { message: "delete success" }
    }catch(e){  
        setResponseStatus(event, 502)    
        return {
            error  : 'e',
        }
    }

   
   
   
    
   
})


