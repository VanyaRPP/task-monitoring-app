import ServicesHeader from '@common/components/Tables/Services/Header'
import ServicesTable from '@common/components/Tables/Services/Table'
import TableCard from '@common/components/UI/TableCard'

export interface Props {
  showAddButton?: boolean
}

const ServicesBlock: React.FC<Props> = ({ showAddButton = false }) => {
  return (
    <TableCard title={<ServicesHeader showAddButton={showAddButton} />}>
      <ServicesTable />
    </TableCard>
  )
}

export default ServicesBlock
