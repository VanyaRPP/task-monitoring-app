/**
 * A row of `companiesAreas` form data, as produced by AreaCalculationCard.
 * `_initialArea` / `_initialRentPart` are stamped on init from the API so we can
 * tell whether a row was actually edited by the user.
 */
export interface CompanyAreaRow {
  _id?: string
  name?: string
  area?: number
  rentPart?: number
  key?: string
  _initialArea?: number
  _initialRentPart?: number
}

const sameNumber = (a: unknown, b: unknown): boolean => Number(a) === Number(b)

/** True when the row has explicit initial values AND `area` or `rentPart`
 *  diverges from them. Rows without initial values (i.e. not seeded from the
 *  API) are treated as unchanged — the modal should not blindly fire updates
 *  for them. */
export const isCompanyAreaChanged = (row: CompanyAreaRow): boolean => {
  if (row._initialArea === undefined && row._initialRentPart === undefined) {
    return false
  }
  return (
    !sameNumber(row.area, row._initialArea) ||
    !sameNumber(row.rentPart, row._initialRentPart)
  )
}

/** Returns only rows that have a real `_id` AND were actually changed by the
 *  user. Used by DomainModal.handleSubmit to avoid spamming editRealEstate
 *  when the modal was opened just to rename the domain. */
export const filterChangedCompaniesAreas = (
  rows: CompanyAreaRow[] | undefined | null
): CompanyAreaRow[] => {
  if (!Array.isArray(rows)) return []
  return rows.filter((c) => !!c._id && isCompanyAreaChanged(c))
}
