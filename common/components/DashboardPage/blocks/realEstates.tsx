import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { IExtendedRealestate } from '@common/api/realestateApi/realestate.api.types'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import CompaniesHeader from '@common/components/Tables/Companies/Header'
import CompaniesTable from '@common/components/Tables/Companies/Table'
import TableCard from '@common/components/UI/TableCard'
import { AppRoutes } from '@utils/constants'
import { isAdminCheck } from '@utils/helpers'
import { useRouter } from 'next/router'
import { createContext, useContext, useState } from 'react'

export const CompanyPageContext = createContext<{
  domainId?: string
  streetId?: string
}>({})
export const useCompanyPageContext = () => useContext(CompanyPageContext)

export interface Props {
  domainId?: string
  streetId?: string
}

const RealEstateBlock: React.FC<Props> = ({ domainId, streetId }) => {
  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.REAL_ESTATE
  const { data: user } = useGetCurrentUserQuery()
  const [currentRealEstate, setCurrentRealEstate] =
    useState<IExtendedRealestate>(null)
  const [filters, setFilters] = useState<any>()

  const {
    data: realEstates,
    isLoading,
    isError,
  } = useGetAllRealEstateQuery({
    domainId: domainId || filters?.domain || undefined,
    companyId: filters?.company || undefined,
    streetId: filters?.street || undefined,
    limit: isOnPage ? 0 : 5,
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
