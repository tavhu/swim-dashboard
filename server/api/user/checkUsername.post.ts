import { getServerSession } from "#auth";


export default eventHandler(async  (event) => {
    const session = await getServerSession(event)
    const body =  await readBody(event)

    // console.log(body)    
    
    if(!session){
        return { status: 'unauthenticated'}
    }    
      
    try {

        const data = body?.username ?  await event.context.prisma.user.findFirst({
            where :{
                username : body?.username
            }
        }) : await event.context.prisma.user.findFirst({
            where :{
                id : body?.id
            }
        })
        // console.log(data)
        //@ts-ignore
        setResponseStatus(event, 201)    
        return data
    }catch(e){  
        //@ts-ignore
        setResponseStatus(event, 412)    
        return {
            error  : 'e',
        }
    }    
})
