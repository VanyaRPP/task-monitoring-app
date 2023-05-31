import { useGetDomainsQuery } from '../../../common/api/domainApi/domain.api'

function useDomain({ domainId }) {
  const { data: domains, isLoading: isDomainsLoading } = useGetDomainsQuery({})
  const domain = domains?.find((domain) => domain._id === domainId)

  return { domain, isDomainsLoading }
}

export default useDomain
