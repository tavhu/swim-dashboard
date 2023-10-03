import { getServerSession } from "#auth";


export default eventHandler(async  event => {
    const session = await getServerSession(event)
    const body =  await readBody(event)

    // console.log(body)    
    
    if(!session){
        return { status: 'unauthenticated'}
    }    
      
    try {
        await event.context.prisma.role.create({
            data: {          
            name : body.roleName,
            description : body.description
            },
        })
        setResponseStatus(event, 201)    
         return { message: "User created" }
    }catch(e){  
        setResponseStatus(event, 412)    
        return {
            error  : 'e',
        }
    }

   
   
   
    
   
})


