import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'

function useDomain({ domainId }) {
  // TODO: check. do we really need it?
  const { data = [], isLoading } = useGetDomainsQuery({ domainId })
  return { data, isLoading }
}

export default useDomain
