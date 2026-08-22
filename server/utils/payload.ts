/**
 * Coerces a client intake payload into the shapes Prisma expects.
 *
 * The two client endpoints passed `body?.field` straight into Prisma, and the
 * form initialises every field to `''`. Prisma rejects `''` for both DateTime
 * and Boolean columns, so leaving any optional date blank — a date of birth, a
 * parent's date of birth — failed the whole save. It also rejects a date-only
 * string like "2026-08-13"; it wants full ISO-8601 or a Date.
 *
 * The endpoints then returned `{ error: "e" }` with a 412, so the form could
 * only say "មិនជោគជ័យ" and the interviewer had no way to know which field was
 * at fault. Verified against a real PostgreSQL 16: '' for DOB, '' for
 * InterViewDate, '' for KnownLegalConsequence and '2026-08-13' for DOB were all
 * rejected.
 */

export interface FieldSpec {
  /** Nullable in the schema — blank means "not recorded". */
  optionalDates?: readonly string[];
  /** Required in the schema; blank is an error the caller must report. */
  requiredDates?: readonly string[];
  /** Required Boolean columns with no schema default. */
  requiredBooleans?: readonly string[];
  /** Boolean columns carrying a default — blank falls back to it. */
  defaultedBooleans?: readonly string[];
}

/** Client_PersonalInformation */
export const CLIENT_FIELDS: FieldSpec = {
  optionalDates: ["DOB", "FOCDOB", "MOCDOB", "DateArrested"],
  requiredDates: ["InterViewDate"],
  requiredBooleans: ["KnownLegalConsequence", "UsedtoRehab"],
  defaultedBooleans: ["ClientFeelsHopless", "status"],
};

/** ClientService (ទម្រង់ទី២). */
export const CLIENT_SERVICE_FIELDS: FieldSpec = {
  optionalDates: ["serviceDate"],
};

/** CasePlan (ទម្រង់ទី៣). Its activity rows are normalised separately, per row. */
export const CASE_PLAN_FIELDS: FieldSpec = {
  optionalDates: ["monitorDate", "nextMonitorDate"],
};

/** One ក. សកម្មភាពសេវាកម្ម row. */
export const CASE_PLAN_ACTIVITY_FIELDS: FieldSpec = {
  optionalDates: ["startDate", "endDate"],
};

/** One ខ. សេវាបញ្ចូនបន្ត referral. Dates optional; consent defaults to false. */
export const CASE_PLAN_REFERRAL_FIELDS: FieldSpec = {
  optionalDates: ["startDate", "endDate"],
  defaultedBooleans: ["consentObtained"],
};

/** ការបញ្ជូន. No dates of its own; the consent box carries a default. */
export const REFERRAL_FIELDS: FieldSpec = {
  defaultedBooleans: ["consentObtained"],
};

/** Reintegration (ទម្រង់ទី៤). Its two service lists use the row spec below. */
export const REINTEGRATION_FIELDS: FieldSpec = {
  optionalDates: ["handoverDate", "monitorDate", "nextMonitorDate"],
};

/** One row of either of ទម្រង់ទី៤'s service lists. */
export const REINTEGRATION_SERVICE_FIELDS: FieldSpec = {
  optionalDates: ["startDate", "endDate"],
};

/** FollowUp (ទម្រង់ទី៥). */
export const FOLLOW_UP_FIELDS: FieldSpec = {
  optionalDates: ["monitorDate", "nextMonitorDate"],
};

/** One row of ទម្រង់ទី៥'s section ២ service list. */
export const FOLLOW_UP_SERVICE_FIELDS: FieldSpec = {
  optionalDates: ["startDate", "endDate"],
};

/**
 * governStaff — the same defect. spouseDateOfBirth is optional in the schema
 * but StaffCanvasForm initialises it to '', so an unmarried staff member
 * failed the entire save.
 */
export const GOVERN_STAFF_FIELDS: FieldSpec = {
  optionalDates: ["spouseDateOfBirth"],
  requiredDates: [
    "DateofBirth",
    "sIDValidStart",
    "sIDValidEnd",
    "DateStartOfficialWork",
    "DateWentFullTime",
  ],
};

function toDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function toBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return null; // includes '' — the radio was never answered
}

export interface NormalisedPayload {
  data: Record<string, any>;
  /** Field names the caller must reject the request over. */
  missing: string[];
}

export function normalisePayload(
  body: Record<string, any>,
  spec: FieldSpec
): NormalisedPayload {
  const data = { ...body };
  const missing: string[] = [];

  for (const f of spec.optionalDates ?? []) {
    if (f in data) data[f] = toDate(data[f]);
  }

  for (const f of spec.requiredDates ?? []) {
    const d = toDate(data[f]);
    if (d === null) missing.push(f);
    else data[f] = d;
  }

  for (const f of spec.requiredBooleans ?? []) {
    const b = toBoolean(data[f]);
    if (b === null) missing.push(f);
    else data[f] = b;
  }

  for (const f of spec.defaultedBooleans ?? []) {
    if (f in data) {
      const b = toBoolean(data[f]);
      // Leave the column to its schema default rather than writing null.
      if (b === null) delete data[f];
      else data[f] = b;
    }
  }

  return { data, missing };
}

export const normaliseClientPayload = (body: Record<string, any>) =>
  normalisePayload(body, CLIENT_FIELDS);

export const normaliseGovernStaffPayload = (body: Record<string, any>) =>
  normalisePayload(body, GOVERN_STAFF_FIELDS);

/**
 * The repeatable rows on ទម្រង់ទី១ — ប្រវត្តិសេវា (ClientServeHistory) and
 * កំណត់ត្រាវិវត្តន៍ (ClientProgress). Unlike the lists on forms ៣–៥ these rows
 * are NOT dropped when partially filled, because both of their columns are NOT
 * NULL: Prisma rejects the whole save with a message no one can act on.
 *
 * A row where every field is blank is one the user added and never used —
 * dropped. A row that is half filled is a mistake the caller must report:
 * `missing` names the list and the row number so the form can highlight it.
 */
export interface NormalisedRows {
  rows: Record<string, any>[];
  /** "ClientServeHistory[2].DateTimeServed" style names for the UI. */
  missing: string[];
}

function normaliseRowList(
  input: unknown,
  fields: { date?: string; requiredText?: string[] },
  listName: string
): NormalisedRows {
  const rows: Record<string, any>[] = [];
  const missing: string[] = [];

  const list = Array.isArray(input) ? input : [];
  list.forEach((rawRow: any, i: number) => {
    const row: Record<string, any> = { ...(rawRow ?? {}) };

    let dateValue: Date | null = null;
    if (fields.date && fields.date in row) {
      dateValue = toDate(row[fields.date]);
      if (dateValue) row[fields.date] = dateValue;
    }

    // Empty means unused; drop it silently. A row counts as empty only when
    // nothing at all was typed anywhere in it.
    const meaningful = Object.entries(row).filter(
      ([k, v]) => k !== "id" && v !== null && v !== undefined && String(v).trim() !== ""
    );
    if (!meaningful.length) return;

    if (fields.date && !dateValue) {
      missing.push(`${listName}[${i}].${fields.date}`);
    }
    for (const f of fields.requiredText ?? []) {
      if (!(String(row[f] ?? "").trim())) {
        missing.push(`${listName}[${i}].${f}`);
      }
    }

    rows.push(row);
  });

  return { rows, missing };
}

/** ប្រវត្តិនៃការធ្លាប់ចូលមជ្ឈមណ្ឌល/ពន្ធនាគារ — date required per row. */
export function normaliseServeHistoryRows(input: unknown): NormalisedRows {
  return normaliseRowList(input, { date: "DateTimeServed", requiredText: ["nameCenterorPrison"] }, "ClientServeHistory");
}

/** ការអភិវឌ្ឍន៍សំខាន់ៗ — date and details required per row. */
export function normaliseProgressRows(input: unknown): NormalisedRows {
  return normaliseRowList(input, { date: "NoteDateTime", requiredText: ["Details"] }, "ClientProgress");
}
