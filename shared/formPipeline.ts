/**
 * The ទម្រង់ទី១ → ទម្រង់ទី៦ pipeline: where a client's case file has got to, and
 * which form may be started next.
 *
 * In `shared/` because the rule has to hold in two places and must not be able
 * to disagree with itself: the browser greys out a form that cannot be started
 * yet, and the endpoints refuse one that arrives anyway.
 *
 * ## The order rule
 *
 * A form opens once the one before it has been **requested** — sent for approval
 * — not once it has been approved. An officer fills ទម្រង់ទី១ in, presses ស្នើសុំ,
 * and ទម្រង់ទី២ is available immediately; whether a director has got to it yet is
 * not the officer's business and must not block their work. So DRAFT is the only
 * status that holds the next form shut, and a rejected form keeps the rest of
 * the pipeline open: the rejection is fixed and re-submitted in place, and
 * stopping five other forms because of it would be a second punishment for one
 * mistake.
 *
 * ## Why a form's state is derived rather than stored
 *
 * ទម្រង់ទី១ is the client and has exactly one record. ទម្រង់ទី២-៦ are episodes —
 * a client can have several service records, several case plans — so "the state
 * of ទម្រង់ទី២" is a summary of however many exist, not a column. The precedence
 * below is what an officer means when they ask how a step is doing: a step with
 * anything approved is done, otherwise anything waiting is the headline,
 * otherwise a rejection is what needs attention.
 */

export type FormState =
  /** Nothing recorded, and the form before it has not been requested — shut. */
  | "locked"
  /** Nothing recorded, but it may be started now. */
  | "available"
  /** Started, not yet sent for approval. */
  | "draft"
  /** Sent, waiting on a decision. */
  | "submitted"
  /** Turned back; needs fixing and re-sending. */
  | "rejected"
  /** Signed off. */
  | "approved";

export interface FormStep {
  /** 1-6. */
  form: number;
  state: FormState;
  /** How many records sit behind this step. ទម្រង់ទី១ is always 0 or 1. */
  count: number;
}

export interface Pipeline {
  steps: FormStep[];
  /** The form the officer should work on next, or null when there is nothing to do. */
  nextForm: number | null;
  /** How many steps are approved, for the progress bar. */
  approved: number;
  /** How many steps have been requested — what the officer has actually finished. */
  requested: number;
  /** How many steps are waiting on a decision, for the approver's queue. */
  awaiting: number;
}

export const FORM_COUNT = 6;

/** Khmer numerals, so a step can be labelled without a lookup table per page. */
export const KHMER_DIGIT = ["", "១", "២", "៣", "៤", "៥", "៦"] as const;

/** A status counts as requested once it has left DRAFT — see the order rule. */
export function isRequested(status: string | null | undefined): boolean {
  return status === "SUBMITTED" || status === "APPROVED" || status === "REJECTED";
}

/**
 * Summarise however many records sit behind one step.
 *
 * `null` for "no records at all" so the caller can decide between locked and
 * available, which depends on the step before it rather than on this one.
 */
function summarise(statuses: readonly string[]): Exclude<FormState, "locked" | "available"> | null {
  if (!statuses.length) return null;
  if (statuses.includes("APPROVED")) return "approved";
  if (statuses.includes("SUBMITTED")) return "submitted";
  if (statuses.includes("REJECTED")) return "rejected";
  return "draft";
}

/**
 * Build the pipeline from each form's record statuses.
 *
 * `perForm[0]` is ទម្រង់ទី១ — one element, or none if somehow unsaved — and
 * `perForm[1..5]` are ទម្រង់ទី២-៦.
 */
export function buildPipeline(perForm: readonly (readonly string[])[]): Pipeline {
  const steps: FormStep[] = [];
  let previousRequested = true; // ទម្រង់ទី១ has nothing before it, so it is always open.

  for (let i = 0; i < FORM_COUNT; i++) {
    const statuses = perForm[i] ?? [];
    const summary = summarise(statuses);

    const state: FormState = summary ?? (previousRequested ? "available" : "locked");
    steps.push({ form: i + 1, state, count: statuses.length });

    // The next form opens only if this one has been sent. A step with no records
    // has not been sent, which is what closes the rest of the pipeline.
    previousRequested = statuses.some(isRequested);
  }

  /**
   * What to do next.
   *
   * The first step that the officer can act on: one they have not finished
   * (draft or not yet started), or one turned back to them. A step waiting on a
   * decision is not their move, so it is skipped — if every remaining step is
   * waiting, there is nothing for them to do and this is null.
   */
  const actionable = steps.find(
    (s) => s.state === "available" || s.state === "draft" || s.state === "rejected"
  );

  return {
    steps,
    nextForm: actionable?.form ?? null,
    approved: steps.filter((s) => s.state === "approved").length,
    requested: steps.filter((s) => ["submitted", "approved", "rejected"].includes(s.state)).length,
    awaiting: steps.filter((s) => s.state === "submitted").length,
  };
}

/**
 * Whether a new record may be created for `form` (2-6).
 *
 * The one function both the menu and the endpoints ask, so a form that looks
 * startable always is, and one that does not cannot be started by posting to the
 * endpoint directly.
 */
export function mayStartForm(pipeline: Pipeline, form: number): boolean {
  const step = pipeline.steps[form - 1];
  return !!step && step.state !== "locked";
}

/** The form that has to be requested before `form` opens. Used in the refusal. */
export function blockingForm(form: number): number {
  return form - 1;
}
