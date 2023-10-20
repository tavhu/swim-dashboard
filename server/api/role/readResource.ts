import { getServerSession } from "#auth";



export default eventHandler(async  (event) => {
    const session = await getServerSession(event)
    const body =  await readBody(event)
    // const body =  getQuery(event)

    // console.log(body)    
    
    if(!session){
        return { status: 'unauthenticated'}
    }    
      
    try {
    //    const totalCount =  await  event.context.prisma.resources.count()
        
       const data = await event.context.prisma.resources.findMany()
        // console.log(data)
        setResponseStatus(event, 201)    
         return  { data } 
    }catch(e){  
        setResponseStatus(event, 412)    
        return {
            error  : 'e',
        }
    }

   
   
   
    
   
})


