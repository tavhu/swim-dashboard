import { usePermissionStore } from "~/stores/permission";

/**
 * May the current user create and edit records of this ទម្រង់?
 *
 * The six view pages asked `checkIfPageReadOnly()`, which answers a different
 * question: it looks up the *current route* — `client-service-view-id`,
 * "ទម្រង់ទី២ មើលលម្អិត" — and reports whether that page is read-only.
 *
 * A view page being read-only is the normal case. It is a page for reading; a
 * role that may view a record and not edit it is exactly what "បានតែមើល" on
 * that row means. But the answer was then used to decide two things it does not
 * govern: whether កែសម្រួល is clickable, and whether the ស្នើសុំ button appears.
 * Both belong to the *edit* resource — `client-service-form`,
 * "ទម្រង់ទី២ បញ្ចូល/កែសម្រួល" — which is a separate row in the grid and may
 * well be granted when the view row is not.
 *
 * That is precisely the ការចូលទិន្នន័យ case: an officer with អនុញ្ញាត on
 * បញ្ចូល/កែសម្រួល and បានតែមើល on មើលលម្អិត could fill a ទម្រង់ in, save it, and
 * then find the record they had just written could neither be edited nor sent
 * for approval.
 */
export function useRecordPermissions(editRoute: string) {
  const store = usePermissionStore();

  /** Write on the form's own create/edit page. */
  const mayEdit = computed(() => store.hasWritePermission(editRoute));

  /**
   * Submitting for approval is part of doing the data entry, so it follows the
   * same right. Approving is not, and is checked separately inside the panel
   * against the `approval` capability.
   */
  const maySubmit = mayEdit;

  return { mayEdit, maySubmit };
}
