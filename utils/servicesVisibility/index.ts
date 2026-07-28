import { Roles } from '@utils/constants'
import type {
  DomainTypeTemplateCategory,
  IDomainTypeTemplate,
} from '@common/api/domainApi/domain.api.types'
export interface IDomainServiceGroup {
  groupName: string
  services: string[]
}

export interface IDomainForVisibility {
  _id?: string
  customServices?: IDomainServiceGroup[]
}

export interface ICustomServiceItem {
  _id: string
  name: string
}

export function isGlobalAdmin(roles: string[] | undefined): boolean {
  return !!roles?.includes(Roles.GLOBAL_ADMIN)
}

export function isDomainAdmin(roles: string[] | undefined): boolean {
  return !!roles?.includes(Roles.DOMAIN_ADMIN)
}

export function getSelectedServiceIds(
  domains: IDomainForVisibility | IDomainForVisibility[] | null | undefined
): string[] {
  const list = Array.isArray(domains) ? domains : domains ? [domains] : []

  const seen = new Set<string>()
  const result: string[] = []

  for (const domain of list) {
    for (const group of domain?.customServices ?? []) {
      for (const id of group?.services ?? []) {
        if (!seen.has(id)) {
          seen.add(id)
          result.push(id)
        }
      }
    }
  }

  return result
}

export function getVisibleServices(
  roles: string[] | undefined,
  domains: IDomainForVisibility | IDomainForVisibility[] | null | undefined,
  allServices: ICustomServiceItem[]
): ICustomServiceItem[] {
  if (!allServices?.length) return []

  if (isGlobalAdmin(roles)) return allServices

  const selectedIds = getSelectedServiceIds(domains)
  if (!selectedIds.length) return []

  const selectedSet = new Set(selectedIds)
  return allServices.filter((s) => selectedSet.has(s._id))
}

export function canEditDomainServiceSelection(
  roles: string[] | undefined
): boolean {
  return isGlobalAdmin(roles)
}

interface IRealEstateLike {
  domain?: IDomainForVisibility | null
}

export function extractDomainsFromRealEstates(
  realEstates: IRealEstateLike[] | null | undefined
): IDomainForVisibility[] {
  if (!realEstates?.length) return []

  const seen = new Set<string>()
  const result: IDomainForVisibility[] = []

  for (const item of realEstates) {
    const domain = item.domain
    if (!domain) continue

    const id = domain._id ? String(domain._id) : null

    if (id) {
      if (seen.has(id)) continue
      seen.add(id)
    }
    result.push(domain)
  }

  return result
}
export const STANDARD_SERVICE_CATEGORIES: DomainTypeTemplateCategory[] = [
  'utility',
  'real-estate',
]

export function shouldShowStandardServices(
  domains: IDomainForVisibility[],
  templates: IDomainTypeTemplate[]
): boolean {
  if (!domains?.length || !templates?.length) return false

  const templateMap = new Map(templates.map((t) => [String(t._id), t]))

  return domains.some((domain) => {
    const templateId = String((domain as any).domainTypeTemplateId ?? '')
    const template = templateMap.get(templateId)
    return template
      ? STANDARD_SERVICE_CATEGORIES.includes(template.category)
      : false
  })
}
