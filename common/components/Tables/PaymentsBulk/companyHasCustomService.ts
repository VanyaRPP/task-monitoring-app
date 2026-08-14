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
  const entries = companyCustoms as CompanyCustomService[]

  // The _id match is authoritative and is looked up across the WHOLE list first:
  // another meter whose name differs only in parentheses shares this fieldName,
  // so a per-entry `id || fieldName` check would let it answer for this one.
  const byId = target.serviceKey
    ? entries.find((cs) => String(cs?._id ?? '') === target.serviceKey)
    : undefined

  // fieldName only speaks for legacy entries that carry no _id of their own.
  const match =
    byId ??
    (target.fieldName
      ? entries.find((cs) => !cs?._id && cs?.fieldName === target.fieldName)
      : undefined)

  // `!= null` is intentional: 0 is a set price (render), undefined/null is not.
  return !!match && match.price != null
}
