import DomainsHeader from '@common/components/Tables/Domains/Header'
import DomainsTable from '@common/components/Tables/Domains/Table'
import TableCard from '@common/components/UI/TableCard'

const DomainsBlock: React.FC = () => {
  return (
    <TableCard title={<DomainsHeader showAddButton />}>
      <DomainsTable />
    </TableCard>
  )
}

export default DomainsBlock
