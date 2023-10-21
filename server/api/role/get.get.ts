import { getServerSession } from "#auth";



export default eventHandler(async  event => {
    const session = await getServerSession(event)
    // const body =  await readBody(event)
    const body =  getQuery(event)

    console.log(body)    
    
    if(!session){
        return { 
            status: 'unauthenticated',
             data: [], 
             total : 0,
            error  : 'e',
    
    }}    
      
    try {
       const totalCount =  await  event.context.prisma.role.count()
       let data = await event.context.prisma.role.findMany({  
            orderBy : {
                id: 'desc'
            },
            //@ts-ignore
            take : (body?.limit ? parseInt(body?.limit) : 1000) ,        
            //@ts-ignore
            skip :  (body?.skip ? parseInt(body?.skip) : 0)
                       
        })

        // console.log('before Perm' , body?.userID)
        let userID : any = body?.userID
        const Perm =  await event.context.prisma.user.findUnique({
        where:{
            id : userID ? userID : ''
        },
        select:{
            Role : {
                select :{
                    name : true,
                    id : true,
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

        console.log('permdata ' , Perm?.Role)
       
        Perm?.Role?.resource.forEach(element => {
            data.filter(item =>{
                console.log((item.id === element?.Resource.id &&  !element?.granted  && !element?.read), item.id, element?.Resource.id, element )
            return  item.id === element?.Resource.id &&  !element?.granted  && !element?.read
          })
        //   console.log(data)
        });

        // console.log(data)
        //@ts-ignore
        setResponseStatus(event, 201)    
         return { data: data, total : totalCount , error :'',
        status : 'authenticated' }
    }catch(e){  
        //@ts-ignore
        setResponseStatus(event, 412)    
        return {
            data: [], 
            total : 0,
            error  : 'e',
            status : 'authenticated'
        }
    }
})


