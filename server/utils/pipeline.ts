import type { H3Event } from "h3";
import { buildPipeline, mayStartForm, blockingForm, KHMER_DIGIT, type Pipeline } from "../../shared/formPipeline";

/**
 * Loading the ទម្រង់ទី១-៦ pipeline for clients.
 *
 * The rule itself lives in shared/formPipeline.ts so the browser and the
 * endpoints cannot drift apart; this is just the database half — one query for a
 * whole page of clients rather than six per row.
 */

/** Only the approval status of each episode: the state is derived from nothing else. */
const EPISODE = { select: { approvalStatus: true } } as const;

export const PIPELINE_SELECT = {
  approvalStatus: true,
  clientServices: EPISODE,
  casePlans: EPISODE,
  reintegrations: EPISODE,
  followUps: EPISODE,
  caseClosures: EPISODE,
} as const;

/** Turn one client row selected with PIPELINE_SELECT into its pipeline. */
export function pipelineOf(row: any): Pipeline {
  const statuses = (list: any[]) => (list ?? []).map((r) => r.approvalStatus);
  return buildPipeline([
    // ទម្រង់ទី១ is the client itself — always exactly one record.
    row?.approvalStatus ? [row.approvalStatus] : [],
    statuses(row?.clientServices),
    statuses(row?.casePlans),
    statuses(row?.reintegrations),
    statuses(row?.followUps),
    statuses(row?.caseClosures),
  ]);
}

/** The pipeline for one client, read fresh. Used by the write guard below. */
export async function loadPipeline(event: H3Event, clientId: string): Promise<Pipeline | null> {
  const row = await event.context.prisma.client_PersonalInformation.findUnique({
    where: { id: clientId },
    select: PIPELINE_SELECT,
  });
  return row ? pipelineOf(row) : null;
}

/**
 * Refuse a new record whose preceding ទម្រង់ has not been requested yet.
 *
 * Creating only. Editing an existing record is never blocked: the record is
 * already there, and a rule about what may be *started* should not be able to
 * strand something already written — including the out-of-order records that
 * predate this rule.
 *
 * `form` is 2-6; ទម្រង់ទី១ has nothing before it.
 */
export async function assertFormOrder(
  event: H3Event,
  clientId: string,
  form: number,
  isCreate: boolean
): Promise<void> {
  if (!isCreate || form <= 1) return;

  const pipeline = await loadPipeline(event, clientId);
  if (!pipeline) return; // No such client — the caller's own check reports that.

  if (!mayStartForm(pipeline, form)) {
    const needed = KHMER_DIGIT[blockingForm(form)];
    throw createError({
      statusCode: 409,
      statusMessage: errorMessage(
        event,
        `សូមបំពេញ និងស្នើសុំការអនុម័តទម្រង់ទី${needed}ជាមុនសិន`
      ),
    });
  }
}
