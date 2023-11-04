import { useDialog }  from "vue3-tailwind";


export const confirmDialog = async ()=> {
    const dialog = useDialog()
    const isConfirmed = await dialog.fire({
        title: "តើអ្នកប្រាកដទេថាអ្នកចង់ដាក់បញ្ជូន?",
        description: "សកម្មភាពនេះគឺមិនអាចត្រឡប់វិញបានទេ។",        
      });
      if (!isConfirmed) return false;
      return true;
}


export const userPermission = async()=>{
  const { data } = useAuth();

  // console.log(data.value?.sub)
  const { data: readRoleToResource } = await <any>useFetch(
    "/api/role/readRoleandResource",
    {
      method: "POST",
      body: JSON.stringify({
        //@ts-ignored
        userID: data.value?.sub
      }),
    }
  )  
  return { readRoleToResource : readRoleToResource }
}

export const checkIfPageReadOnly  = () =>{
  const route = useRoute()
  // console.log('page readonly', route.name)
  const permission = <any>useState('userPermission')
  let test = false 
  if(permission.value){
    permission.value.find((element : any) => {
      // console.log(element?.Resource?.frontEndURL)
       if(element?.Resource?.frontEndURL === route.name && !element.granted && element?.read){
        test = true      
        console.log(route.name)       
       }
    });
  }
  return test  
}

