import { getServerSession } from "#auth";
import { hash } from 'bcrypt'

export default eventHandler(async  event => {
    const session = await getServerSession(event)
    const body =  await readBody(event)

    // console.log(body)        
    if(!session){
        return { status: 'unauthenticated'}
    }    
      
    try {
        await event.context.prisma.user.upsert({
            where :{
                id : body?.id
            },
            update: {
                firstname : body?.firstname,      
                lastname : body?.lastname,    
                username: body?.username,
                image : body?.image,          
                status : body?.status,            
                serviceCenterID : body?.serviceCenterID,                
                password: body?.updatePass ?  await hash(body?.password,12): body?.password 
            },
            create : {
                firstname : body?.firstname,      
                lastname : body?.lastname,       
                username : body?.username,          
                password : await hash(body?.password,12),
                image : body?.image,          
                status : body?.status,   
                serviceCenterID : body?.serviceCenterID,               
            }
        })
        // console.log(res)
        setResponseStatus(event, 201)    
        return { message: "User Update or Created" }
    }catch(e){  
        console.log(e)
        setResponseStatus(event, 412)    
        return {
            error  : 'e',
        }
    }   
})


