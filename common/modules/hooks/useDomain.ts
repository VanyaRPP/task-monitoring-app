import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'

function useDomain({ domainId }) {
  const { data, isLoading } = useGetDomainsQuery({})
  if (domainId) {
    const singleDomain = data?.find((i) => i._id === domainId)
    return { data: singleDomain ? [singleDomain] : [], isLoading }
  }

  return { data, isLoading }
}

export default useDomain
