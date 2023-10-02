import { getServerSession } from "#auth";


export default eventHandler(async  event => {
    const session = await getServerSession(event)
    const body =  await readBody(event)

    // console.log(body)    
    
    if(!session){
        return { status: 'unauthenticated'}
    }    
      
    try {

        await event.context.prisma.role.delete({
            where : {
                id: body?.id
            }
        })

        setResponseStatus(event, 201)    
         return { message: "delete success" }
    }catch(e){  
        setResponseStatus(event, 502)    
        return {
            error  : 'e',
        }
    }

   
   
   
    
   
})


