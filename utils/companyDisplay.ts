export const ARCHIVED_COMPANY_LABEL = 'Архівована'
export const UNAVAILABLE_COMPANY_LABEL = 'Недоступна'
export const UNAVAILABLE_COMPANY_HINT =
  'Компанія видалена або недоступна для поточного користувача'

export enum CompanyDisplayStatus {
  Active = 'active',
  Archived = 'archived',
  Unavailable = 'unavailable',
}

export interface CompanyLike {
  _id?: unknown
  companyName?: string
  archived?: boolean
}

export interface CompanyDisplay {
  status: CompanyDisplayStatus
  // Real company name. For archived companies it is shown only in a tooltip;
  // for unavailable ones it is unknown. Never falls back to the id.
  name?: string
}

const sameId = (a: unknown, b: unknown) =>
  a != null && b != null && String(a) === String(b)

/**
 * Decides how a company referenced by id should be shown to the user, so a
 * selector/table never falls back to the raw ObjectId:
 *  - present among `activeCompanies` (the selectable list) → its name;
 *  - present among `knownCompanies` (archived list, populated document, …) →
 *    "Архівована" with the name for a tooltip when archived, else its name;
 *  - nowhere → "Недоступна" (deleted / other domain / no access).
 * Returns null when there is no id at all (nothing selected).
 */
export function resolveCompanyDisplay(
  companyId: unknown,
  activeCompanies: CompanyLike[] = [],
  knownCompanies: CompanyLike[] = []
): CompanyDisplay | null {
  if (companyId == null || companyId === '') return null

  const active = activeCompanies.find((c) => sameId(c?._id, companyId))
  if (active && !active.archived) {
    return { status: CompanyDisplayStatus.Active, name: active.companyName }
  }

  const known = active ?? knownCompanies.find((c) => sameId(c?._id, companyId))
  if (known?.archived) {
    return { status: CompanyDisplayStatus.Archived, name: known.companyName }
  }
  if (known?.companyName) {
    return { status: CompanyDisplayStatus.Active, name: known.companyName }
  }

  return { status: CompanyDisplayStatus.Unavailable }
}
