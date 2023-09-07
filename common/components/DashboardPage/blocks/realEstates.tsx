import CompaniesHeader from '@common/components/Tables/Companies/Header'
import CompaniesTable from '@common/components/Tables/Companies/Table'
import TableCard from '@common/components/UI/TableCard'
import { createContext, useContext, useState } from 'react'
import { isAdminCheck } from '@utils/helpers'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { IExtendedRealestate } from '@common/api/realestateApi/realestate.api.types'

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
  const { data: user } = useGetCurrentUserQuery()
  const [currentRealEstate, setCurrentRealEstate] = useState<IExtendedRealestate>(null)
  
  return (
    <TableCard
      title={
        <CompaniesHeader
          showAddButton={isAdminCheck(user?.roles)}
          currentRealEstate={currentRealEstate}
          setCurrentRealEstate={setCurrentRealEstate}
        />
      }
    >
      <CompaniesTable
        domainId={domainId}
        streetId={streetId}
        setCurrentRealEstate={setCurrentRealEstate}
      />
    </TableCard>
  )
}

export default RealEstateBlock
