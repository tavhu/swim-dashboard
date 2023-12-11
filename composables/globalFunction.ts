import { useDialog } from "vue3-tailwind";

export const confirmDialog = async () => {
  const dialog = useDialog();

  const isConfirmed = await dialog.fire({
    title: "តើអ្នកប្រាកដទេថាអ្នកចង់ដាក់បញ្ជូន?",
    description: "សកម្មភាពនេះគឺមិនអាចត្រឡប់វិញបានទេ។",
  });
  if (!isConfirmed) return false;
  return true;
};

export const userPermission = async () => {
  const { data } = useAuth();

  // console.log(data.value?.sub)
  const { data: readRoleToResource } = await (<any>(
    useFetch("/api/role/readRoleandResource", {
      method: "POST",
      body: JSON.stringify({
        //@ts-ignored
        userID: data.value?.sub,
      }),
    })
  ));
  return { readRoleToResource: readRoleToResource };
};

export const checkIfPageReadOnly = () => {
  const route = useRoute();
  // console.log('page readonly', route.name)
  const permission = <any>useState("userPermission");
  let test = false;
  if (permission.value) {
    permission.value.find((element: any) => {
      // console.log(element?.Resource?.frontEndURL)
      if (
        element?.Resource?.frontEndURL === route.name &&
        !element.granted &&
        element?.read
      ) {
        test = true;
        console.log(route.name);
      }
    });
  }
  return test;
};

export const timeagoInKhmer = (timeAgoEn: string) => {
  return timeAgoEn
    .replace("hours", "ម៉ោង")
    .replace("hour", "ម៉ោង")
    .replace("ago", "មុន")
    .replace("just now", "ឥឡូវនេះ")
    .replace("minutes", "នាទី")
    .replace("minute", "នាទី")
    .replace("yesterday", "ម្សិលមិញ")
    .replace("days", "ថ្ងៃ")
    .replace("day", "ថ្ងៃ")
    .replace("last week", "សប្ដាហ៍​មុន")
    .replace("weeks", "សប្ដាហ៍​")
    .replace("last month", "ខែមុន")
    .replace("months", "ខែ")
    .replace("last year", "ឆ្នាំមុន")
    .replace("years", "ឆ្នាំ")
    .replace("1", "១")
    .replace("2", "២")
    .replace("3", "៣")
    .replace("4", "៤")
    .replace("5", "៥")
    .replace("6", "៦")
    .replace("7", "៧")
    .replace("8", "៨")
    .replace("9", "៩")
    .replace("0", "០")
    .replaceAll(" ", "");
};
