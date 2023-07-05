import {
  useGetDomainsQuery,
  useGetMyDomainsQuery,
} from '@common/api/domainApi/domain.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { Roles } from '@utils/constants'

function useDomain({ domainId }) {
  const { data: userResponse } = useGetCurrentUserQuery()
  const isGlobalAdmin = userResponse?.roles?.includes(Roles.GLOBAL_ADMIN)
  
  const useQuery = isGlobalAdmin ? useGetDomainsQuery : useGetMyDomainsQuery

  const { data, isLoading } = useQuery({})
  if (domainId) {
    const singleDomain = data?.find((i) => i._id === domainId)
    return {
      data: singleDomain ? [singleDomain] : [],
      isLoading
    }
  }
  if (
    userResponse?.roles?.includes(Roles.DOMAIN_ADMIN) ||
    userResponse?.roles?.includes(Roles.USER)
  ) {
    return { data: data || [], isLoading }
  }

  return { data, isLoading }
}

export default useDomain
