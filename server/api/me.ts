import { getServerSession } from "#auth"

export default eventHandler(async  event => {
    const session = await getServerSession(event)
    const body =  await readBody(event)

    console.log('none first')
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

    // console.log(account || 'none')
    return account
})