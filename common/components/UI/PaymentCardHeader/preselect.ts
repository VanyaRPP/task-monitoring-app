export function resolvePreselectedDomain(
  filterDomains: string[] | undefined,
  domainFilter: { value: string }[] | undefined
): string | undefined {
  if (filterDomains?.length === 1) return filterDomains[0]
  if (domainFilter?.length === 1) return domainFilter[0].value
  return undefined
}

export function resolvePreselectedCompany(
  filterCompanies: string[] | undefined,
  realEstatesFilter: { value: string }[] | undefined
): string | undefined {
  if (filterCompanies?.length === 1) return filterCompanies[0]
  if (realEstatesFilter?.length === 1) return realEstatesFilter[0].value
  return undefined
}
