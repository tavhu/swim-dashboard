import { getServerSession } from "#auth";
import nodemailer from "nodemailer"
//@ts-ignored
const transporter = nodemailer.createTransport({
    // @ts-ignored
  host: process.env.EMAIL_HOST,
  port: 587,
  secure: false,
  auth: {
        user: process.env.EMAIL_USER, //'noreply.cbid@dac.gov.kh', // your domain email address
        pass: process.env.EMAIL_PASSWORD //'0ygojytQT1' // your password
    },
    tls: {
        rejectUnauthorized: false,
        rateLimit: true, // enable to make sure we are limiting
        maxConnections: 1, // set limit to 1 connection only
        maxMessages: 3, // send 3 emails per second
    }
});

const SECRET_KEY = '6LdNhQ0pAAAAAAXcoJRxSP48zlTKJach05kWBlib'

export default eventHandler(async  event => {
    const session = await getServerSession(event)
    const body =  await readBody(event)
    // if(!session){
    //     return { status: 'unauthenticated', data: [], total : 0, error  : 'e',}
    // }    

    if(! body?.token){
        console.log('no token')
        setResponseStatus(event, 412)
        return {
            status: false
        }
    }

    const response = await $fetch<{ success: boolean, 'error-codes': string[] }>(
        `https://www.google.com/recaptcha/api/siteverify?secret=${SECRET_KEY}&response=${body?.token}`
        )   
    console.log(response, SECRET_KEY ,body?.token)
        if(!response.success ){
            setResponseStatus(event, 412)
            return {
                status : false
            }
        }

       try {
         const info = await transporter.sendMail({
            from: '"Website Contact" <noreply.cbid@dac.gov.kh>', // sender address
            to: "thona@dac.gov.kh", // list of receivers
            subject: `${body?.reason}`, // Subject line
            text: "", // plain text body
            html: ` 
            <!DOCTYPE html>
            <html>
            <head>          
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Battambang:wght@100&display=swap" rel="stylesheet">
            </head>
            <body>
            <div style="font-size:12px;font-family:Battambang"> <b>Contact form </b> 
            <br><b>ឈ្មោះ</b> 
            <br>${body?.name}
            <br><br> 
            <b>អុីមែល</b>
            ${body?.email}
            <br><br>
            <b>លេខទូរស័ព្ទ</b>
            <br> ${body?.phone}
            <br><br>
            <b>មូលហេតុ</b>
            <br> ${body?.serviceCenterName} ${body?.username ? body?.username : ''}
            <br><br>
            <b>ព័ត៌មានលម្អិត</b>
            <br> ${body?.details}
           <div>             
            </body>
            </html>
           `, // html body
        })
        // console.log("Message sent: %s", info.messageId);
        
        if(info.messageId){
            await event.context.prisma.contactMessage.create({
                data: {
                    email : body?.email ,
                    name :    body?.name ,
                    phone :    body?.phone ,
                    details :    body?.details ,
                    reason :    body?.reason ,
                    serviceCenterName :    body?.serviceCenterName ,
                    username :    body?.username ,               
                }
            })
        }
        setResponseStatus(event, 201)
         return { status : true }
    }catch(e){

        console.log(e)
        setResponseStatus(event, 412)
        return { status : e }
    }
})
