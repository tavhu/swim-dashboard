import { getServerSession } from "#auth";
export default eventHandler(async  (event) => {
    const session = await getServerSession(event)
    const body =  await readBody(event)
    // const body =  getQuery(event)
    // console.log('session ', session)        
    if(!session){
        return { status: 'unauthenticated'}
    }    
    
    try {
    //    const totalCount =  await  event.context.prisma.resources.count()
       const userID = body?.userID
       const data = await event.context.prisma.user.findUnique({
        where:{
            id: userID
        },
        select:{
            Role : {
                select :{
                    resource : {
                        select :{
                            granted : true,
                            read : true,
                            Resource : true
                        }
                    }
                }
            }
        }
       })
        // console.log(data)
        //@ts-ignore
        setResponseStatus(event, 201)    
         return  { data } 
    }catch(e){  
        //@ts-ignore
        setResponseStatus(event, 412)    
        return {
            error  : 'e',
        }
    }
})


