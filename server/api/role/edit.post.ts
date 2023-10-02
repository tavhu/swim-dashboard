import { getServerSession } from "#auth";


export default eventHandler(async  event => {
    const session = await getServerSession(event)
    const body =  await readBody(event)

    console.log(body)    
    
    if(!session){
        return { status: 'unauthenticated'}
    }    
      
    try {
        await event.context.prisma.role.update({
            where :{
                id: body.id
            },
            data: {          
                name : body.roleName,
                description : body.description           
            },
        })
        setResponseStatus(event, 201)    
         return { message: "User Updated" }
    }catch(e){  
        setResponseStatus(event, 412)    
        return {
            error  : 'e',
        }
    }    
   
})


