import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { Roles } from '@utils/constants'

function useDomain({ domainId }) {
  const { data: userResponse } = useGetCurrentUserQuery()

  const { data, isLoading } = useGetDomainsQuery({})
  if (domainId) {
    const singleDomain = data?.find((i) => i._id === domainId)
    return { data: singleDomain ? [singleDomain] : [], isLoading }
  }
  if (userResponse?.roles?.includes(Roles.DOMAIN_ADMIN)) {
    const singleDomain = data?.find((domain) =>
      domain.adminEmails.includes(userResponse?.email)
    )
    return { data: singleDomain ? [singleDomain] : [], isLoading }
  }

  return { data, isLoading }
}

export default useDomain
