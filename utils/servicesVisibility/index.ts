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
  disabledServiceIds?: string[]
}

type DomainsInput =
  IDomainForVisibility | IDomainForVisibility[] | null | undefined

function toDomainList(domains: DomainsInput): IDomainForVisibility[] {
  return Array.isArray(domains) ? domains : domains ? [domains] : []
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

export function getSelectedServiceIds(domains: DomainsInput): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const domain of toDomainList(domains)) {
    const disabled = new Set(domain?.disabledServiceIds ?? [])
    for (const group of domain?.customServices ?? []) {
      for (const id of group?.services ?? []) {
        if (!seen.has(id) && !disabled.has(id)) {
          seen.add(id)
          result.push(id)
        }
      }
    }
  }

  return result
}

export function getDisabledServiceIds(domains: DomainsInput): string[] {
  const list = toDomainList(domains)
  const enabled = new Set(getSelectedServiceIds(list))
  const result = new Set<string>()
  for (const domain of list) {
    for (const id of domain?.disabledServiceIds ?? []) {
      if (!enabled.has(id)) result.add(id)
    }
  }
  return Array.from(result)
}

/**
 * Built-in company-table columns that are driven by a fixed-id catalog
 * service. Disabling that service in the domain hides the column.
 */
export const STANDARD_COLUMN_SERVICE_IDS: Readonly<Record<string, string>> = {
  rentPart: '677d437c83b6ef93c6b8ea50',
  waterPart: '677d412483b6ef93c6b8e9fa',
  cleaning: '677d434c83b6ef93c6b8ea3a',
  garbageCollector: '68156d58f520914e5e1ad881',
  inflicion: '68230f76a51fddf0ae165d77',
  pricePerMeter: '677d414283b6ef93c6b8ea2c',
  servicePricePerMeter: '677d414283b6ef93c6b8ea2c',
}

export function excludeDisabledServices<T extends { _id: string }>(
  services: T[],
  domains: DomainsInput
): T[] {
  const disabled = new Set(getDisabledServiceIds(domains))
  if (!disabled.size) return services
  return services.filter((s) => !disabled.has(String(s._id)))
}

export function getVisibleServices(
  roles: string[] | undefined,
  domains: DomainsInput,
  allServices: ICustomServiceItem[]
): ICustomServiceItem[] {
  if (!allServices?.length) return []

  if (isGlobalAdmin(roles)) return excludeDisabledServices(allServices, domains)

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
