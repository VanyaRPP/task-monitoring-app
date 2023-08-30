import CompaniesHeader from '@common/components/Tables/Companies/Header'
import CompaniesTable from '@common/components/Tables/Companies/Table'
import TableCard from '@common/components/UI/TableCard'
import { createContext, useContext } from 'react'
import { isAdminCheck } from '@utils/helpers'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'

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
  
  return (
    <TableCard title={<CompaniesHeader showAddButton={isAdminCheck(user?.roles)} />}>
      <CompaniesTable domainId={domainId} streetId={streetId} />
    </TableCard>
  )
}

export default RealEstateBlock
