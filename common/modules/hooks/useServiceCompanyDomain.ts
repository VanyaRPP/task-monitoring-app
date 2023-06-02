import useCompany from './useCompany'
import useDomain from './useDomain'
import useService from './useService'

function useServiceCompanyDomain({ serviceId, companyId, domainId, streetId }) {
  const { company } = useCompany({
    companyId,
    domainId,
    streetId,
  })

  const { service } = useService({
    serviceId,
    domainId,
    streetId,
  })

  const { data: domain } = useDomain({ domainId })

  return { company, service, domain }
}

export default useServiceCompanyDomain
