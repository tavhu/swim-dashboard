export default defineNuxtRouteMiddleware(async (to, from) => {
    
    
    // const result = await useFetch('')
    const data = await userPermission()

    // console.log(to.fullPath)
    let test = false
    //@ts-ignore
    data.readRoleToResource.value?.data?.Role?.resource?.forEach((element : any) => {
      //  console.log(element)
     if(element?.Resource?.frontEndURL === to.fullPath && ! element?.granted  && ! element?.read){
      //  console.log(element)
        test = true
     }
    });
    if( test ){
      return navigateTo('/')
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