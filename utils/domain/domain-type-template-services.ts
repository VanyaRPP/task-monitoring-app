import { IDomainTypeTemplate } from '@common/api/domainApi/domain.api.types'

export interface DomainCustomServiceGroup {
  groupName: string
  services: string[]
}

/**
 * Map a DomainTypeTemplate into the `customServices` shape stored on a Domain.
 * Mirrors the inline mapping the full DomainModal uses when seeding a new domain
 * from its selected template (see DomainModal/index.tsx).
 */
export const domainTypeTemplateToCustomServices = (
  template?: Pick<IDomainTypeTemplate, 'groups'> | null
): DomainCustomServiceGroup[] =>
  (template?.groups ?? []).map((g) => ({
    groupName: g.groupName,
    services: (g.serviceIds ?? []).map(String),
  }))
