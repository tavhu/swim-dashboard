export default defineNuxtRouteMiddleware(async (to, from) => {
    
    
    // const result = await useFetch('')
    const data  = await userPermission()
    const {data : currentUser } = useAuth()
    
    useState('userPermission',  ()=>  data.readRoleToResource.value?.data?.Role?.resource)

    // console.log(to.fullPath)
    let test = false
    //@ts-ignore
    data.readRoleToResource.value?.data?.Role?.resource?.forEach((element : any) => {
      //  console.log(element)
     if(element?.Resource?.frontEndURL === to.name && ! element?.granted  && ! element?.read){
       console.log(element)
        test = true
     }
    });


    if( test ){         
      //@ts-ignore
      if(to.name == 'register' && to.query?.id === currentUser.value?.sub){
        //allow to edit profile if user try to edit their own profile
        return true;
      }
    
      return abortNavigation()
      // return navigateTo('/')
    }
    
    // if (to.query.id === '1') {         
    //   // console.log('123')
    //   return abortNavigation()
    // }

    // console.log(data.readRoleToResource.value?.data?.Role?.resource)


    // In a real app you would probably not redirect every route to `/`
    // however it is important to check `to.path` before redirecting or you
    // might get an infinite redirect loop
   
    // if (to.path !== '/') {
    //   return navigateTo('/')
    // }

  })