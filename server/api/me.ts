import { getServerSession } from "#auth";
import { hash } from 'bcrypt'

export default eventHandler(async  event => {
    const session = await getServerSession(event)
    const body =  await readBody(event)

    // console.log('none first')
    
    if(!session){
        return { status: 'unauthenticated'}
    }    

    const account = await event.context.prisma.user.findFirst({
        where :{          
                username : 'admin'            
        }
    })
    
  
    await event.context.prisma.user.create({
        data: {          
            firstname: 'thona',          
            lastname: 'thy',
            middlename : '',
            password: await hash('admin123', 12),
            username : 'admin',
            image : 'https://scontent.fpnh20-1.fna.fbcdn.net/v/t39.30808-1/369941904_6657478190971902_7666118862279045219_n.jpg?stp=cp0_dst-jpg_p40x40&_nc_cat=108&ccb=1-7&_nc_sid=fe8171&_nc_eui2=AeHr_05UJViT66kQaWfqbrGYu7DYduI9BfO7sNh24j0F82J4bLWryvZVlNz-YWjxUCOA31VukbPmRA4DN9HkIM38&_nc_ohc=w8Ryuwj1W1QAX-hHPqO&_nc_ht=scontent.fpnh20-1.fna&cb_e2o_trans=t&oh=00_AfDb9nVotpb6fkVJNByqrYiSJWDs302pL8tqRlri5bus6Q&oe=65194E62'                       
        },
    })

    setResponseStatus(event, 201)
    
    return { message: "User created" }
    
    console.log(account)

    return account
})