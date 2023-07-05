import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'

function useCompany({ companyId, domainId, streetId }) {
  // TODO: fix
  // something with streetId
  const strtId = streetId?._id || streetId
  const { data: companies, isLoading } = useGetAllRealEstateQuery({
    domainId,
    streetId: strtId,
  })

  // TODO: fix
  // something with companyId
  const cmpnyId = companyId?._id || companyId
  const company = companies?.find((i) => i._id === cmpnyId)
  return { company, isLoading }
}

export default useCompany
