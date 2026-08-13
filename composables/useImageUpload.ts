/**
 * Uploads the selected file(s) to `/api/user/upload`.
 *
 * Returns `null` when nothing was chosen — that is not a failure. **Throws**
 * when the upload itself fails, which is the whole point of this existing.
 *
 * Four copies of this function were pasted across the forms, and every one of
 * them caught the error, logged it to the console, and returned `undefined`.
 * Callers all do:
 *
 *     image = await handleImageUpload()
 *     if (image) { formData.photo = image[0] }
 *
 * so a failed upload fell straight through that `if`, the record was saved with
 * the previous image or none at all, and the user was shown a success toast.
 * The upload endpoint rejects anything over 10 MB and anything outside its MIME
 * allowlist (see SECURITY.md), so this was reachable by picking the wrong file.
 *
 * `$fetch` rather than `useFetch`: this runs from an event handler, not from
 * setup, which is not what `useFetch` is for.
 */
export function useImageUpload() {
  const uploadImage = async (
    files: FileList | File[] | null | undefined
  ): Promise<Record<number, string> | null> => {
    if (!files || files.length === 0) return null;

    const fd = new FormData();
    Array.from(files).forEach((file, index) => fd.append(String(index), file as File));

    return await $fetch<Record<number, string>>("/api/user/upload", {
      method: "POST",
      body: fd,
    });
  };

  return { uploadImage };
}
