import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'

function useDomain({ domainId }) {
  const { data, isLoading } = useGetDomainsQuery({})
  if (domainId)
    return { data: [data?.find((i) => i._id === domainId)], isLoading }

  return { data, isLoading }
}

export default useDomain
