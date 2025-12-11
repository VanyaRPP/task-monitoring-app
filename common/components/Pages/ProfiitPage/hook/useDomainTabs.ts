import { useGetDomainsByAdminQuery } from '@common/api/domainApi/domain.api'
import { useMemo } from 'react'

export const useDomainTabs = () => {
  const { data = [], isLoading, isError } = useGetDomainsByAdminQuery()

  const tabList = useMemo(
    () =>
      data.map((domain) => ({
        key: domain._id,
        tab: domain.name,
      })),
    [data]
  )

  return { tabList, isLoading, isError }
}
