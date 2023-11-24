import CompaniesHeader from '@common/components/Tables/Companies/Header'
import CompaniesTable from '@common/components/Tables/Companies/Table'
import TableCard from '@common/components/UI/TableCard'
import { createContext, useContext, useState } from 'react'
import { isAdminCheck } from '@utils/helpers'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { IExtendedRealestate } from '@common/api/realestateApi/realestate.api.types'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { useRouter } from 'next/router'
import { AppRoutes } from '@utils/constants'

export const CompanyPageContext = createContext<{
  domainId?: string
  streetId?: string
}>({})
export const useCompanyPageContext = () => useContext(CompanyPageContext)

export interface Props {
  domainId?: string
  streetId?: string
}

const RealEstateBlock: React.FC<Props> = ({
  domainId,
  streetId,
}) => {
  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.REAL_ESTATE
  const { data: user } = useGetCurrentUserQuery()
  const [currentRealEstate, setCurrentRealEstate] = useState<IExtendedRealestate>(null)
  const [filters, setFilters] = useState<any>()

  const {
    data: realEstates,
    isLoading,
    isError,
  } = useGetAllRealEstateQuery({
    domainId,
    streetId,
    limit: isOnPage ? 0 : 5,
    companyIds: filters?.company || undefined,
    domainIds: filters?.domain || undefined,
  })
  
  return (
      <TableCard
      title={
        <CompaniesHeader
          showAddButton={isAdminCheck(user?.roles)}
          currentRealEstate={currentRealEstate}
          setCurrentRealEstate={setCurrentRealEstate}
          realEstates={realEstates}
          filters={filters}
          setFilters={setFilters}
        />
      }
    >
      <CompaniesTable
        domainId={domainId}
        streetId={streetId}
        setCurrentRealEstate={setCurrentRealEstate}
        realEstates={realEstates}
        isLoading={isLoading}
        isError={isError}
        filters={filters}
        setFilters={setFilters}
      />
    </TableCard>
  )
}

export default RealEstateBlock
