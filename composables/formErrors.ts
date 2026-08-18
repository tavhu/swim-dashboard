/**
 * Showing a user which fields stopped their form from saving.
 *
 * A long ទម្រង់ scrolls well past a screenful, so a toast naming the missing
 * fields is only half an answer: the user still has to hunt for them. These
 * helpers do the other half — mark the fields, then take the user to the first
 * one.
 *
 * Two kinds of field, because there are two kinds of validation:
 *
 *   data-error   vue3-tailwind sets this on any control its own validator
 *                rejected. Free, and it covers most of every form.
 *   data-field   for the ones the validator never sees — radio groups, date
 *                pickers, and the signature check — the wrapper carries
 *                `data-field="<name>"` and gets `.field-invalid` added here.
 *
 * Both are styled in assets/css/main.css.
 */

/** Remove every highlight this module applied. Called before each new attempt. */
export function clearFieldErrors(root: ParentNode = document) {
  root.querySelectorAll(".field-invalid").forEach((el) => el.classList.remove("field-invalid"));
}

/**
 * Highlight the named fields and scroll to whichever comes first on the page.
 *
 * Returns the element scrolled to, or null when nothing matched — a caller can
 * use that to tell the difference between "shown" and "we could not point at
 * it", rather than silently doing nothing.
 */
export function markFieldErrors(names: string[], root: ParentNode = document): Element | null {
  clearFieldErrors(root);

  for (const name of names) {
    root
      .querySelectorAll(`[data-field="${CSS.escape(name)}"]`)
      .forEach((el) => el.classList.add("field-invalid"));
  }

  return scrollToFirstError(root);
}

/**
 * Scroll to the first field in error, wherever it came from.
 *
 * Document order, not the order the caller listed them: the user is being sent
 * to a place on the page, and the top-most problem is the one to start from.
 * `data-error` is set by the library asynchronously, so callers await a tick
 * before calling this.
 */
export function scrollToFirstError(root: ParentNode = document): Element | null {
  const candidates = [
    ...root.querySelectorAll('[data-error="true"], .field-invalid'),
  ] as HTMLElement[];
  if (!candidates.length) return null;

  // The one nearest the top of the document.
  const first = candidates.reduce((best, el) =>
    el.getBoundingClientRect().top < best.getBoundingClientRect().top ? el : best
  );

  first.scrollIntoView({ behavior: "smooth", block: "center" });
  // Focus so a keyboard user lands there too, but only where it makes sense —
  // focusing a wrapper div would take focus away from the page for nothing.
  const focusable = first.matches("input, select, textarea, button")
    ? first
    : first.querySelector<HTMLElement>("input, select, textarea, button");
  focusable?.focus({ preventScroll: true });

  return first;
}
