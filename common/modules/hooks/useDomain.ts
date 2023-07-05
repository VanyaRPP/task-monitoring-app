import {
  useGetDomainsQuery,
  useGetMyDomainsQuery,
} from '@common/api/domainApi/domain.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { Roles } from '@utils/constants'

function useDomain({ domainId }) {
  const { data: userResponse } = useGetCurrentUserQuery()

  const { data: allDomains, isLoading: allDomainsLoading } = useGetDomainsQuery({})
  const {data: myDomains, isLoading: myDomainsLoading} = useGetMyDomainsQuery({})
  if (domainId) {
    const singleDomain = allDomains?.find((i) => i._id === domainId)
    return {
      data: singleDomain ? [singleDomain] : [],
      isLoading: allDomainsLoading,
    }
  }
  if (
    userResponse?.roles?.includes(Roles.DOMAIN_ADMIN) ||
    userResponse?.roles?.includes(Roles.USER)
  ) {
    return { data: myDomains ? myDomains : [], isLoading: myDomainsLoading }
  }

  return { data: allDomains, isLoading: allDomainsLoading }
}

export default useDomain
