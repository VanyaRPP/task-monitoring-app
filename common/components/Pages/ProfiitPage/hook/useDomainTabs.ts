import { useGetDomainsByAdminQuery } from '@common/api/domainApi/domain.api'

export const useDomainTabs = () => {
  const { data = [], isLoading, isError } = useGetDomainsByAdminQuery()

  const tabList = data.map((domain) => ({
    key: domain._id,
    tab: domain.name,
  }))

  return { tabList, isLoading, isError }
}
