import { useDialog } from "vue3-tailwind";

/**
 * Whether the open confirm dialog is destructive, read by the dialog template in
 * app.vue to turn the icon badge and the accept button red.
 *
 * A module-level ref rather than useState() because confirmDelete() is called
 * from click handlers, where the Nuxt instance is not guaranteed. The dialog is
 * client-only and this always starts false, so there is nothing for SSR to leak.
 */
export const confirmDialogDanger = ref(false);

/**
 * The shared confirmation.
 *
 * Saving and deleting used the same wording and the same green button, so a
 * delete looked exactly like a save. `confirmDelete()` below asks a different
 * question in red, and names what is about to go.
 */
export const confirmDialog = async (opts?: {
  title?: string;
  description?: string;
  acceptText?: string;
  danger?: boolean;
  icon?: string;
}) => {
  const dialog = useDialog();

  // TwDialog only carries the keys it knows about, so a `danger` passed to
  // fire() never reaches the template — the panel stayed green on a delete.
  // It rides on the shared ref above instead, set just before firing.
  confirmDialogDanger.value = opts?.danger ?? false;

  const isConfirmed = await dialog.fire({
    title: opts?.title ?? "តើអ្នកប្រាកដទេថាអ្នកចង់ដាក់បញ្ជូន?",
    description: opts?.description ?? "សកម្មភាពនេះគឺមិនអាចត្រឡប់វិញបានទេ។",
    acceptText: opts?.acceptText ?? "យល់ព្រម",
    rejectText: "បោះបង់",
    ...(opts?.icon ? { icon: opts.icon } : {}),
  } as any);

  // After the close transition, not immediately: resetting on the same tick
  // turns the button green again while the panel is still fading out.
  setTimeout(() => (confirmDialogDanger.value = false), 300);

  if (!isConfirmed) return false;
  return true;
};

/**
 * Deleting a client removes the whole case file — all six ទម្រង់, the progress
 * notes, the previous centres, the photograph and every attachment. Saying so
 * is the difference between a confirmation and a formality.
 */
export const confirmDelete = async (what?: string) =>
  confirmDialog({
    title: "លុបចេញ?",
    description: what
      ? `${what}<br /><span class="text-sm">សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។</span>`
      : "សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។",
    acceptText: "លុបចេញ",
    danger: true,
    icon: "alert-triangle",
  });

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
