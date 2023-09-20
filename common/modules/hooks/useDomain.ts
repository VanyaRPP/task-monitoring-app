import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'

function useDomain({ domainId }) {
  // TODO: check. do we really need it?
  const { data: domains, isLoading } = useGetDomainsQuery({ domainId })
  return { data: domains?.data, isLoading }
}

export default useDomain
