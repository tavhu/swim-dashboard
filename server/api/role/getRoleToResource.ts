import { getServerSession } from "#auth";

export default eventHandler(async  event => {
    const session = await getServerSession(event)
    const body =  await readBody(event)
    // const body =  getQuery(event)

    // console.log(body)    
    
    if(!session){
        return { status: 'unauthenticated'}
    }    
      
    try {

       const data = await event.context.prisma.roleToResource.findMany({  
            where : {
                userID : body?.userID
            },         
        })
        // console.log(data)
        setResponseStatus(event, 201)    
         return { data: data }
    }catch(e){  
        setResponseStatus(event, 412)    
        return {
            error  : 'e',
        }
    }
})


