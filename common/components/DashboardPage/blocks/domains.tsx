import DomainsHeader from '@common/components/Tables/Domains/Header'
import DomainsTable from '@common/components/Tables/Domains/Table'
import TableCard from '@common/components/UI/TableCard'

export interface Props {
  domainId?: string
}

const DomainsBlock: React.FC<Props> = ({ domainId }) => {
  return (
    <TableCard title={<DomainsHeader />}>
      <DomainsTable domainId={domainId} />
    </TableCard>
  )
}

export default DomainsBlock
