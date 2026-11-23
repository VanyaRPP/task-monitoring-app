import { useGetDomainIdsByServiceTypeQuery } from '@common/api/domainApi/domain.api'
import { ServiceType } from '@utils/constants'

export interface IDebtCalculationAccess {
  /** `_id`s of the domains whose catalog carries the housing-fee service. */
  domainIds: string[]
  /** At least one domain has it, so the page is worth showing. */
  hasAccess: boolean
  isLoading: boolean
}

/**
 * Access to the debt calculation page.
 *
 * The endpoint is admin-only: a non-admin gets a 403, `data` stays empty and
 * `hasAccess` comes out `false`, so the gate closes on its own.
 */
export const useDebtCalculationAccess = (
  skip = false
): IDebtCalculationAccess => {
  const { data = [], isLoading } = useGetDomainIdsByServiceTypeQuery(
    ServiceType.HousingFee,
    { skip }
  )

  return { domainIds: data, hasAccess: data.length > 0, isLoading }
}
