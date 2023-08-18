import CompaniesHeader from '@common/components/Tables/Companies/Header'
import CompaniesTable from '@common/components/Tables/Companies/Table'
import TableCard from '@common/components/UI/TableCard'
import { createContext, useContext } from 'react'

export const CompanyPageContext = createContext<{
  domainId?: string
  streetId?: string
}>({})
export const useCompanyPageContext = () => useContext(CompanyPageContext)

export interface Props {
  domainId?: string
  streetId?: string
  showAddButton?: boolean
}

const RealEstateBlock: React.FC<Props> = ({
  domainId,
  streetId,
  showAddButton = false,
}) => {
  return (
    <TableCard title={<CompaniesHeader showAddButton={showAddButton} />}>
      <CompaniesTable domainId={domainId} streetId={streetId} />
    </TableCard>
  )
}

export default RealEstateBlock
