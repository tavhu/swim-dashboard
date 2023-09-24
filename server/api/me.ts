import { getServerSession } from "#auth"

export default eventHandler(async  event => {
    const session = await getServerSession(event)
    const body =  await readBody(event)

    if(!session){
        return { status: 'unauthenticated'}
    }    

    const account = await event.context.prisma.account.findFirst({
        where :{
            user:{
                username : body.username
            }
        }
    })

    return {account}
})