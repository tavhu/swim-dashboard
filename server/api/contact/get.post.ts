import { getServerSession } from "#auth";
import { readListQuery, searchFilter, orderByFor } from "../../utils/listQuery";

const SORTABLE = ["createdAt", "name", "email", "reason", "read"] as const;
const SEARCHABLE = ["name", "email", "phone", "reason", "details", "serviceCenterName"] as const;

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

        const q = readListQuery(body, {
            sortable: SORTABLE,
            searchable: SEARCHABLE,
            defaultSort: 'createdAt',
            defaultSortType: 'desc',
        })
        const where = searchFilter(q.search, SEARCHABLE) ?? {}

        const [data, totalCount] = await Promise.all([
            event.context.prisma.contactMessage.findMany({
                where,
                orderBy: orderByFor(q.sortBy, q.sortType),
                take: q.take,
                skip: q.skip,
            }),
            event.context.prisma.contactMessage.count({ where }),
        ])

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


