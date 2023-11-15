import { getServerSession } from "#auth";

export default eventHandler(async event => {
    const session = await getServerSession(event)
    const body = await readBody(event)
    // const body =  getQuery(event)
    // console.log(body)    

    if (!session) {
        return {
            status: 'unauthenticated',
            data: [],
            total: 0,
            error: 'e',
        }
    }
    try {

        if (body?.id) {
            const SingleuserData = await event.context.prisma.contactMessage.findFirst({
                where: {
                    id: body?.id
                }
            })
            setResponseStatus(event, 201)
            return SingleuserData
        }

        const totalCount = await event.context.prisma.contactMessage.count()
        const data = await event.context.prisma.contactMessage.findMany({
            orderBy: {
                id: 'desc'
            },
            //@ts-ignore
            take: (body?.limit ? parseInt(body?.limit) : 1000),
            //@ts-ignore
            skip: (body?.skip ? parseInt(body?.skip) : 0),
        })

        //@ts-ignored // console.log(data) 
        setResponseStatus(event, 201)
        return {
            data: data, total: totalCount, error: '',
            status: 'authenticated'
        }

    } catch (e) {
        //@ts-ignored
        setResponseStatus(event, 412)
        return {
            data: [],
            total: 0,
            error: 'e',
            status: 'authenticated'
        }
    }
})


