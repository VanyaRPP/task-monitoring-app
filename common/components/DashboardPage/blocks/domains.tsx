import DomainsHeader from '@common/components/Tables/Domains/Header'
import DomainsTable from '@common/components/Tables/Domains/Table'
import TableCard from '@common/components/UI/TableCard'

export interface Props {
  domainId?: string
  showAddButton?: boolean
}

const DomainsBlock: React.FC<Props> = ({ domainId, showAddButton = false }) => {
  return (
    <TableCard title={<DomainsHeader showAddButton={showAddButton} />}>
      <DomainsTable domainId={domainId} />
    </TableCard>
  )
}

export default DomainsBlock
