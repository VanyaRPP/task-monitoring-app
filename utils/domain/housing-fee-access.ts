import { BUILT_IN_SERVICE_ID_TO_TYPE, ServiceType } from '@utils/constants'
import { resolveServiceType } from './resolve-service-type'

/**
 * The minimal shape of a catalog service - structurally compatible with both
 * `ICustomDomainService['services'][number]` and a `CustomService` document.
 */
export interface IDomainCatalogServiceLike {
  _id?: string | { toString(): string } | null
  serviceType?: string | null
  fieldName?: string | null
}

export interface IDomainCatalogGroupLike {
  services?: IDomainCatalogServiceLike[] | null
}

/**
 * The first service of the given type in a domain's catalog, or `undefined`.
 *
 * The type is resolved through {@link resolveServiceType}, NOT by matching a
 * pinned `_id`: cloning a template into a domain creates the domain's own
 * copies with fresh `_id`s (see
 * `/api/domain-type-templates/[id]/clone-for-domain`), and `serviceType` is
 * what they still share. The pinned-id fallback covers older domains that
 * reference the global services directly.
 */
export const findDomainServiceByType = (
  groups: IDomainCatalogGroupLike[] | null | undefined,
  type: ServiceType
): IDomainCatalogServiceLike | undefined => {
  for (const group of groups ?? []) {
    for (const service of group?.services ?? []) {
      if (service && resolveServiceType(service) === type) return service
    }
  }

  return undefined
}

/**
 * Whether the domain carries the housing-fee service - the gate for the debt
 * calculation page.
 */
export const hasHousingFeeService = (
  groups: IDomainCatalogGroupLike[] | null | undefined
): boolean => !!findDomainServiceByType(groups, ServiceType.HousingFee)

/**
 * Pinned `_id`s of the built-in services of a given type.
 *
 * The server needs them to find domains that reference a global service
 * directly, from before the document gained a `serviceType` field.
 */
export const builtInServiceIdsForType = (type: ServiceType): string[] =>
  Object.entries(BUILT_IN_SERVICE_ID_TO_TYPE)
    .filter(([, mapped]) => mapped === type)
    .map(([id]) => id)
