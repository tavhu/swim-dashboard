import CredentialsProvider from 'next-auth/providers/credentials'
import { NuxtAuthHandler } from "#auth";
import { compare } from 'bcrypt';
import { PrismaClient } from '@prisma/client';


const runtimeConfig = useRuntimeConfig()
const prisma = new PrismaClient()

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
          // token.id = user.id
          token.username = user.username
          token.fullname = user.firstname + user.lastname
        }
        return token
      },   
      session : async ({session , token})=>{
        // const me: any = await getMe(session) 
        // ;(session as any) = user
        return Promise.resolve(session)
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
              statusMessage:  encodeURI("គណនីឬលេខសំងាត់មិនត្រឹមត្រូវ"),
            })  
          }
  
          const isPasswordValid = await compare(credentials?.password, user.password)
  
          if (!isPasswordValid || !user.status) {
            throw createError({
              statusCode: 403,
              statusMessage: encodeURI(!user.status ? "គណនីត្រូវបានបិទ​! សូមទំនាក់ទំនងអ្នកគ្រប់គ្រង ":  "គណនីឬលេខសំងាត់មិនត្រឹមត្រូវ"),
            })  
          }  
          return user
        }
      })
    ],  
})