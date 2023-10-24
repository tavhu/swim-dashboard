import { getServerSession } from "#auth";

export default eventHandler(async  event => {
    const session = await getServerSession(event)
    // const body =  await readBody(event)
    const body =  getQuery(event)

    // console.log(body)    
    
    if(!session){
        return { 
            status: 'unauthenticated',
             data: [], 
             total : 0,
            error  : 'e',    
    }}   
    try {
       const totalCount =  await  event.context.prisma.user.count()
       const data = await event.context.prisma.user.findMany({        
        select:{
            username :true,
            id : true,
            firstname : true,
            lastname : true,
            image : true,
            status : true,            
            userRoleID : true,    
            Role :{
                select : {
                    id: true,
                    name: true
                }
            }           
        },            
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
         return { data: data, total : totalCount , error :'',
        status : 'authenticated' }

    }catch(e){  
        setResponseStatus(event, 412)    
        return {
            data: [], 
            total : 0,
            error  : 'e',
            status : 'authenticated'
        }
    }
})


