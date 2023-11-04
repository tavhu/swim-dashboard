import { getServerSession } from "#auth";


export default eventHandler(async  (event) => {
    const session = await getServerSession(event)
    const body =  await readBody(event)

    // console.log(body)    
    
    if(!session){
        return { status: 'unauthenticated'}
    }    
      
    try {
        const totalCount =  await  event.context.prisma.staff.count()
        const data = body?.id ?  await event.context.prisma.staff.findFirst({
            where :{
                id : body?.id
            },
        }) : await event.context.prisma.staff.findMany({
            select :{
                id : true ,
                title : true ,
                firstName : true ,
                lastName : true ,
                gender : true ,
                position : true ,
                telephone : true ,
                email : true ,
                serviceCenterID : true ,
                ServiceCenter : {
                    select : {
                        id : true,
                        nameKH : true
                    }
                }
            }
            ,
            orderBy : {
                id: 'desc'
            },
            //@ts-ignore
            take : (body?.limit ? parseInt(body?.limit) : 1000) ,        
            //@ts-ignore
            skip :  (body?.skip ? parseInt(body?.skip) : 0),            
        })
        // console.log(data)      
        setResponseStatus(event, 201)    
        return  body?.id ? data : { data: data, total : totalCount , error :'',
        status : 'authenticated' }
    }catch(e){        
        setResponseStatus(event, 412)    
        return {
            error  : e,
        }
    }    
})
