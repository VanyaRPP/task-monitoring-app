interface CompanyCustomService {
  _id?: unknown
  fieldName?: string
  price?: unknown
}

/**
 * Whether a company actually carries a given custom service — i.e. it has a
 * customServices entry (matched by the stable _id, or fieldName as a fallback)
 * whose `price` is SET. A price of 0 counts as set (the company uses the service
 * and just isn't charged); only `undefined`/`null` means the company does not
 * carry it.
 *
 * Used to hide the Bulk cell on rows where the company doesn't use the service,
 * mirroring how the built-in cells hide themselves (e.g. Cleaning).
 */
export function companyHasCustomService(
  companyCustoms: unknown,
  target: { serviceKey: string; fieldName?: string }
): boolean {
  if (!Array.isArray(companyCustoms)) return false
  return companyCustoms.some((cs: CompanyCustomService) => {
    const matchesId =
      !!target.serviceKey && String(cs?._id ?? '') === target.serviceKey
    const matchesField =
      !!target.fieldName && cs?.fieldName === target.fieldName
    // `!= null` is intentional: 0 is a set price (render), undefined/null is not.
    return (matchesId || matchesField) && cs?.price != null
  })
}
