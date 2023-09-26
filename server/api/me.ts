import { getServerSession } from "#auth"

export default eventHandler(async  event => {
    const session = await getServerSession(event)
    const body =  await readBody(event)

    console.log('none first')
    
    if(!session){
        return { status: 'unauthenticated'}
    }    

    const account = await event.context.prisma.user.findFirst({
        where :{          
                username : 'thonathy'            
        }
    })


    // await event.context.prisma.users.create({
    //     data: {
    //         email: body.email,
    //         name: body.name,
    //         password: await hash(body.password, 12)
    //     },
    // })

    // setResponseStatus(event, 201)
    
    // return { message: "User created" }
    
    console.log(account)
    return account
})