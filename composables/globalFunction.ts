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
  const { data: readRoleToResource } = await useFetch(
    "/api/role/getRoleToResource",
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