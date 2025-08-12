import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { IExtendedRealestate } from '@common/api/realestateApi/realestate.api.types'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import CompaniesHeader from '@components/Tables/Companies/Header'
import CompaniesTable from '@components/Tables/Companies/Table'
import TableCard from '@components/UI/TableCard'
import { AppRoutes } from '@utils/constants'
import { isAdminCheck } from '@utils/helpers'
import { useRouter } from 'next/router'
import { createContext, useContext, useState } from 'react'

export const CompanyPageContext = createContext<{
  domainId?: string
  streetId?: string | null
}>({})
export const useCompanyPageContext = () => useContext(CompanyPageContext)

export interface Props {
  domainId?: string
  streetId?: string
  sepDomainID?: string
}

const RealEstateBlock: React.FC<Props> = ({
  domainId,
  streetId,
  sepDomainID,
}) => {
  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.REAL_ESTATE
  const { data: user } = useGetCurrentUserQuery()
  const [currentRealEstate, setCurrentRealEstate] =
    useState<IExtendedRealestate>(null)
  const [filters, setFilters] = useState<any>()
  const [isArchive, setIsArchive] = useState(false)
  const [realEstateActions, setRealEstateActions] = useState({ edit: false })

  const {
    data: realEstates,
    isLoading,
    isError,
  } = useGetAllRealEstateQuery(
    {
      domainId: sepDomainID || domainId || filters?.domain || undefined,
      companyId: filters?.company || undefined,
      streetId: streetId || filters?.street || undefined,
      limit: isOnPage ? 0 : 5,
      archived: isArchive,
    },
    { refetchOnMountOrArgChange: isArchive }
  )
  const domain = sepDomainID || domainId || filters?.domain?.[0]

  const isSingleCompanyByDomain = (() => {
    if (!domain || !realEstates?.data?.length) return false
    const domainScoped = realEstates.data.filter(
      (r) => r.domain?._id === domain
    )
    const uniqueCompanies = new Set(domainScoped.map((r) => r.companyName))
    return uniqueCompanies.size === 1
  })()

  return (
    <TableCard
    style={{ height: '100%' }}
      title={
        <CompaniesHeader
          showAddButton={isAdminCheck(user?.roles)}
          currentRealEstate={currentRealEstate}
          setCurrentRealEstate={setCurrentRealEstate}
          realEstates={realEstates}
          filters={filters}
          setFilters={setFilters}
          setIsArchive={setIsArchive}
          realEstateActions={realEstateActions}
          setRealEstateActions={setRealEstateActions}
          enableRealEstateButton={!sepDomainID}
          isSingleCompanyByData={isSingleCompanyByDomain}
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
        realEstateActions={realEstateActions}
        setRealEstateActions={setRealEstateActions}
      />
    </TableCard>
  )
}

export default RealEstateBlock
