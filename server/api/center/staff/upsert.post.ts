import { getServerSession } from "#auth";


export default eventHandler(async  event => {
    const session = await getServerSession(event)
    const body =  await readBody(event)

    // console.log(body)    

    if(!session){
        return { status: 'unauthenticated'}
    }
      
    try {
        await event.context.prisma.staff.upsert({
            where :{
                id : body?.id
            },
            update: {
                title : body?.title,
                firstName : body?.firstName,
                lastName : body?.lastName,
                gender : body?.gender,
                position : body?.position,
                telephone : body?.telephone,
                email : body?.email,
                serviceCenterID : body?.serviceCenterID,
            },
            create : {                             
                title : body?.title,
                firstName : body?.firstName,
                lastName : body?.lastName,
                gender : body?.gender,
                position : body?.position,
                telephone : body?.telephone,
                email : body?.email,
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


