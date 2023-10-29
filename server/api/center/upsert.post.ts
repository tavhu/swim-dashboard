import { getServerSession } from "#auth";


export default eventHandler(async  event => {
    const session = await getServerSession(event)
    const body =  await readBody(event)

    // console.log(body)    

    if(!session){
        return { status: 'unauthenticated'}
    }
      
    try {
        await event.context.prisma.serviceCenter.upsert({
            where :{
                id : body?.id
            },
            update: {
                nameKH : body?.nameKH,      
                nameEN : body?.nameEN,     
                type   : body?.type,      
                directorName : body?.directorName,
                phoneNumber : body?.phoneNumber,
                PoBox : body?.PoBox,
                email : body?.email,       
                website : body?.website,    
                locationMap : body?.locationMap,
                Address : body?.Address,
                HeadQuarterPhoneNumber : body?.HeadQuarterPhoneNumber,
                HeadQuarterWebsite : body?.HeadQuarterWebsite,
                HeadQuarterEmail : body?.HeadQuarterEmail,
                HeadQuarterAddress : body?.HeadQuarterAddress,
                HeadQuarterCountry : body?.HeadQuarterCountry,
                overview : body?.overview,
                background : body?.background,
                mission : body?.mission,
                vision : body?.vision,   
                goal   : body?.goal,
                ProjectSummary : body?.ProjectSummary
            },
            create : {                             
                nameKH : body?.nameKH,      
                nameEN : body?.nameEN,     
                type   : body?.type,      
                directorName : body?.directorName,
                phoneNumber : body?.phoneNumber,
                PoBox : body?.PoBox,
                email : body?.email,       
                website : body?.website,    
                locationMap : body?.locationMap,
                Address : body?.Address,
                HeadQuarterPhoneNumber : body?.HeadQuarterPhoneNumber,
                HeadQuarterWebsite : body?.HeadQuarterWebsite,
                HeadQuarterEmail : body?.HeadQuarterEmail,
                HeadQuarterAddress : body?.HeadQuarterAddress,
                HeadQuarterCountry : body?.HeadQuarterCountry,
                overview : body?.overview,
                background : body?.background,
                mission : body?.mission,
                vision : body?.vision,   
                goal   : body?.goal,
                ProjectSummary : body?.ProjectSummary
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


