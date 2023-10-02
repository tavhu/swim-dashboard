import { getServerSession } from "#auth";



export default eventHandler(async  event => {
    const session = await getServerSession(event)
    // const body =  await readBody(event)
    const body =  getQuery(event)

    // console.log(body)    
    
    if(!session){
        return { status: 'unauthenticated'}
    }    
      
    try {
       const totalCount =  await  event.context.prisma.role.count()
       const data = await event.context.prisma.role.findMany({  

            where : {
                name : {
                    not : ' '
                }
            },
            orderBy : {
                id: 'desc'
            },
            //@ts-ignore
            take : (body?.limit ? parseInt(body?.limit) : 5) ,        
            //@ts-ignore
            skip :  (body?.skip ? parseInt(body?.skip) : 5)
                       
        })
        // console.log(data)
        setResponseStatus(event, 201)    
         return { data: data, total : totalCount }
    }catch(e){  
        setResponseStatus(event, 412)    
        return {
            error  : 'e',
        }
    }

   
   
   
    
   
})


