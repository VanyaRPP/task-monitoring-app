import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import {
  applyDomainDisplay,
  IServiceAliasEntry,
} from '@utils/domain/service-display'

export interface IDomainDisplaySettings {
  serviceAliases?: IServiceAliasEntry[] | null
  hideQuantityAndPrice?: boolean | null
}

/**
 * The domain's invoice display settings. A populated domain object is used
 * as is; a bare id (or an object without the settings) is looked up.
 */
export function useDomainDisplaySettings(
  rawDomain: unknown
): IDomainDisplaySettings | undefined {
  const obj =
    typeof rawDomain === 'object' && rawDomain !== null
      ? (rawDomain as Record<string, any>)
      : null
  const domainId: string =
    (obj ? obj._id : (rawDomain as string | undefined)) || ''
  const isPopulated =
    !!obj && ('serviceAliases' in obj || 'hideQuantityAndPrice' in obj)

  const { data: domains } = useGetDomainsQuery(
    { domainId },
    { skip: !domainId || isPopulated }
  )

  return isPopulated
    ? (obj as IDomainDisplaySettings)
    : domains?.find((d) => String(d._id) === String(domainId))
}

/**
 * Applies the domain's display settings (service aliases, hidden
 * quantity/price) to a payment. Resolved at render time so old invoices
 * follow the domain's current settings.
 */
export function useDomainDisplayData<T extends Record<string, any> | null>(
  payment: T
): T {
  const settings = useDomainDisplaySettings(payment?.domain)
  return applyDomainDisplay(payment as any, settings) as T
}
