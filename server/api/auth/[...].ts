import CredentialsProvider from 'next-auth/providers/credentials'
import { NuxtAuthHandler } from "#auth";
import { compare } from 'bcrypt';
import { PrismaClient } from '@prisma/client';


const runtimeConfig = useRuntimeConfig()
const prisma = new PrismaClient()

/**
 * The message for a failed sign-in.
 *
 * These next-auth callbacks receive no h3 `event`, so the usual
 * errorMessage(event, …) helper cannot run here — it referenced an undefined
 * `event`, and that ReferenceError was what reached the login page as
 * "event is not defined" instead of a real reason. Login errors are shown in
 * Khmer; encodeURI matches how /login decodes the ?error= it is handed.
 */
const loginError = (khmer: string) => encodeURI(khmer)

export default NuxtAuthHandler({
    // secret needed to run nuxt-auth in production mode (used to encrypt data)
    secret: process.env.NUXT_SECRET,
    pages :{
      signIn : '/login',
      signOut: '/login',
      error: '/login',
    },
    // adapter : PrismaAdapter(prisma),
    callbacks : {        
      async jwt({ token, user }: { token: any, user: any }) {

        if (user) { 
          token.id = user.id
          token.image = user.image
          token.status = user.status
          token.username = user.username
          token.fullname = user.firstname + user.lastname     
          token.serviceCenterID = user.serviceCenterID     
        }
        
        return token
      },   
      session : async ({ token, user } : { token: any, user: any })=>{        
        const me = await prisma.user.findUnique({
          where: { id : token?.id },
        })
        
        // ;(session as any) = user       
        // console.log(me)
        if(!me?.status){
          // token.status = me.status
          throw createError({
            statusCode: 403,
            statusMessage: loginError("គណនីត្រូវបានបិទ! សូមទំនាក់ទំនងអ្នកគ្រប់គ្រង")
          })  
        }

        if (user) { 
          token.id = user.id
          token.image = me ? me.image : user.image
          token.status = user.status
          token.username = user.username
          token.fullname = user.firstname + user.lastname        
        }
        
        if(me.image){
          token.image = me.image
        }
        // if(!user.status){
        //   return false
        // }
        // console.log(user?.status)

        return token
      }
    },
    providers: [
      // @ts-expect-error You need to use .default here for it to work during SSR. May be fixed via Vite at some point
      CredentialsProvider.default({
       
        async authorize (credentials: any) {  
          const user = await prisma.user.findUnique({
            where: { username: credentials?.username },
          })
  
          if(!user) {
            throw createError({
              statusCode: 403,
              statusMessage: loginError("គណនីឬលេខសំងាត់មិនត្រឹមត្រូវ"),
            })  
          }            
          const isPasswordValid = await compare(credentials?.password, user.password)  
          if (!isPasswordValid || !user.status) {
            throw createError({
              statusCode: 403,
              statusMessage: loginError(!user.status ? "គណនីត្រូវបានបិទ! សូមទំនាក់ទំនងអ្នកគ្រប់គ្រង" : "គណនីឬលេខសំងាត់មិនត្រឹមត្រូវ"),
            })  
          }  
          return user
        }
      })
    ],  
})
