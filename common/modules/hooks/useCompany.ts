import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'

function useCompany({ companyId, domainId, streetId }) {
  const { data: companies, isLoading } = useGetAllRealEstateQuery({
    domainId,
    streetId,
  })
  const company = companies?.find((i) => i._id === companyId)
  return { company, isLoading }
}

export default useCompany
