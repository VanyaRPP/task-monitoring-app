import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'

interface IUseCompanyProps {
  companyId: any
  skip?: boolean
}

function useCompany({ companyId, skip }: IUseCompanyProps) {
  const cmpnyId = companyId?._id || companyId
  const { data: realEstates, isLoading } = useGetAllRealEstateQuery(
    { companyId: cmpnyId },
    { skip }
  )

  const company = realEstates?.data ? realEstates?.data[0] : null

  return { company, isLoading }
}

export default useCompany
