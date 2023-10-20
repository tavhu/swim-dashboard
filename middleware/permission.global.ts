export default defineNuxtRouteMiddleware(async (to, from) => {
    
    // const result = await useFetch('')
    const data = await userPermission()
    if (to.query.id === '1') {          
      // console.log('123')
      return abortNavigation()
    }

    console.log(data.readRoleToResource)
    // In a real app you would probably not redirect every route to `/`
    // however it is important to check `to.path` before redirecting or you
    // might get an infinite redirect loop
   
    // if (to.path !== '/') {
    //   return navigateTo('/')
    // }
  })