import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'

interface IUseCompanyProps {
  companyId?: any
  domainId?: string
  streetId?: any
  skip?: boolean
}

function useCompany({ companyId, domainId, streetId, skip }: IUseCompanyProps) {
  // TODO: fix
  // something with streetId
  const strtId = streetId?._id || streetId
  const { data: companies, isLoading } = useGetAllRealEstateQuery({
    domainId,
    streetId: strtId,
  }, { skip })

  // TODO: fix
  // something with companyId
  const cmpnyId = companyId?._id || companyId
  const company = companies?.find((i) => i._id === cmpnyId)
  return { company, isLoading }
}

export default useCompany
