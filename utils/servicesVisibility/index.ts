import { Roles } from '@utils/constants'

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

  const domainIds = new Set(
    (Array.isArray(domains) ? domains : domains ? [domains] : [])
      .map((d) => (d && d._id ? String(d._id) : ''))
      .filter(Boolean)
  )

  return allServices.filter((s: any) => {
    if (selectedSet.has(s._id)) return true
    const svcDomain = (s as any).domain
    if (svcDomain && domainIds.has(String(svcDomain))) return true
    return false
  })
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
