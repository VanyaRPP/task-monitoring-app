import DomainTypeTemplate, {
  DomainTypeTemplateCategory,
} from '@modules/models/domain-type-template'

/**
 * Returns the union of CustomService ids referenced by every built-in,
 * non-archived DomainTypeTemplate of the given category. This is the
 * data-driven replacement for hardcoded "default services per category" lists.
 */
export async function getDefaultServiceIdsForCategory(
  category: DomainTypeTemplateCategory
): Promise<string[]> {
  const templates = await DomainTypeTemplate.find({
    isBuiltIn: true,
    category,
    archivedAt: null,
  })
    .select({ groups: 1 })
    .lean()

  const ids = new Set<string>()
  for (const tpl of templates) {
    for (const g of tpl.groups ?? []) {
      for (const sid of g.serviceIds ?? []) {
        ids.add(String(sid))
      }
    }
  }
  return [...ids]
}
