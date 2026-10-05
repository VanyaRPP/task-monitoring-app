import { useMemo } from 'react'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { useGetDomainsByAdminQuery } from '@common/api/domainApi/domain.api'
import { useGetRealEstateFiltersQuery } from '@common/api/filterApi/filter.api'
import { useGetMyCompaniesQuery } from '@common/api/realestateApi/realestate.api'
import { Roles } from '@utils/constants'

export type ProfitScopeType = 'domain' | 'company'

export interface ProfitScopeOption {
  type: ProfitScopeType
  key: string
  label: string
}

export interface ProfitScope {
  type: ProfitScopeType
  id: string
}

/** Encodes a scope into the flat string the tab selector/Redux store use. */
export const encodeProfitScopeKey = (type: ProfitScopeType, id: string) =>
  `${type}:${id}`

export const decodeProfitScopeKey = (
  key: string | undefined
): ProfitScope | null => {
  if (!key) return null
  const separator = key.indexOf(':')
  if (separator <= 0) return null
  const type = key.slice(0, separator)
  const id = key.slice(separator + 1)
  if ((type === 'domain' || type === 'company') && id) {
    return { type, id }
  }
  return null
}

/**
 * Every domain/company the current user can open a profit ledger for.
 *
 * Domains: GlobalAdmin sees all, DomainAdmin sees theirs - queried directly
 * here rather than through the shared useDomainTabs, because that hook's
 * only other consumer (BankTransactions) is still admin-only, so a 403 there
 * is a genuine error. Here it is not: this page now also serves plain Users
 * who administer a company but no domain, and /api/domain/admin 403s anyone
 * who isn't a DomainAdmin/GlobalAdmin - "you have zero domains" for them, not
 * a failure, so it must not read as one on this page's error banner.
 *
 * Companies: a self-service billing view for the company's OWNER, not a
 * domain-admin breakdown - so it deliberately does NOT reuse the "my
 * companies" logic that widens for domain admins. `/real-estate/my` answers
 * "which company is mine" and never widens for GlobalAdmin either (that is
 * a tested guarantee of the Profile page), so GlobalAdmin gets a separate,
 * unrestricted source here (the filter endpoint, which already bypasses all
 * scoping when isGlobalAdmin is true).
 */
export const useProfitScopes = () => {
  const { data: currentUser } = useGetCurrentUserQuery()
  const isGlobalAdmin = Boolean(
    currentUser?.roles?.includes(Roles.GLOBAL_ADMIN)
  )

  const {
    data: domains = [],
    isFetching: domainsLoading,
    error: domainsError,
  } = useGetDomainsByAdminQuery({ archived: false })

  // A plain User (no domain, only a company) gets 403 here by design - that
  // is "no domains for you", not a failure. Anything else (500, a dropped
  // connection) is a real error worth surfacing.
  const domainsFailed =
    !!domainsError && !('status' in domainsError && domainsError.status === 403)

  const { data: allCompanies, isFetching: allCompaniesLoading } =
    useGetRealEstateFiltersQuery({ archived: false }, { skip: !isGlobalAdmin })
  const { data: myCompanies, isFetching: myCompaniesLoading } =
    useGetMyCompaniesQuery(undefined, { skip: isGlobalAdmin })

  const domainOptions: ProfitScopeOption[] = useMemo(
    () =>
      domains.map((d) => ({
        type: 'domain' as const,
        key: d._id,
        label: d.name,
      })),
    [domains]
  )

  const companyOptions: ProfitScopeOption[] = useMemo(() => {
    if (isGlobalAdmin) {
      return (allCompanies?.realEstatesFilter ?? []).map((c) => ({
        type: 'company' as const,
        key: c.value,
        label: c.text,
      }))
    }
    return (myCompanies?.data ?? [])
      .filter((c) => !c.archived)
      .map((c) => ({
        type: 'company' as const,
        key: c._id,
        label: c.companyName,
      }))
  }, [isGlobalAdmin, allCompanies, myCompanies])

  return {
    domainOptions,
    companyOptions,
    isLoading:
      domainsLoading ||
      (isGlobalAdmin ? allCompaniesLoading : myCompaniesLoading),
    isError: domainsFailed,
  }
}
