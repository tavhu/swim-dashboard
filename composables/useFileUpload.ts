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
 *
 * Named for files rather than images: the endpoint has always accepted
 * documents too, and ទម្រង់ទី២ and ទម្រង់ទី៤ attach contracts and reports, not
 * photographs. Callers that only want a photograph restrict it at the picker.
 *
 * `$fetch` rather than `useFetch`: this runs from an event handler, not from
 * setup, which is not what `useFetch` is for.
 */

/** What the server's allowlist actually accepts, for pickers and messages. */
export const ACCEPTED_UPLOAD_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
].join(",");

/** Same list in the words a user would recognise. */
export const ACCEPTED_UPLOAD_LABEL = "JPG, PNG, WEBP, GIF, PDF, DOC, DOCX, XLS, XLSX";

/** The endpoint's own limits, so the form can say them before trying. */
export const MAX_UPLOAD_FILES = 10;
export const MAX_UPLOAD_MB = 10;

export function useFileUpload() {
  const uploadFiles = async (
    files: FileList | File[] | null | undefined
  ): Promise<Record<number, string> | null> => {
    if (!files || files.length === 0) return null;

    const fd = new FormData();
    Array.from(files).forEach((file, index) => fd.append(String(index), file as File));

    try {
      return await $fetch<Record<number, string>>("/api/user/upload", {
        method: "POST",
        body: fd,
      });
    } catch (e: any) {
      // Say why. "Could not upload" sends the interviewer back to try the same
      // file again; the endpoint already knows whether it was too big or the
      // wrong type, so carry that through — and name the types it does take,
      // which previously listed only the four image formats.
      const status = e?.response?.status ?? e?.statusCode;
      const detail =
        status === 413
          ? `ឯកសារធំពេក (អតិបរមា ${MAX_UPLOAD_MB}MB ក្នុងមួយឯកសារ និង ${MAX_UPLOAD_FILES} ឯកសារក្នុងមួយលើក)`
          : status === 400 || status === 415
            ? `ប្រភេទឯកសារមិនត្រូវបានអនុញ្ញាត (${ACCEPTED_UPLOAD_LABEL})`
            : e?.data?.statusMessage ?? e?.statusMessage ?? e?.message;
      throw new Error(detail || "Upload failed");
    }
  };

  return { uploadFiles };
}
