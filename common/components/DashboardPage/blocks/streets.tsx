import StreetsHeader from '@common/components/Tables/Streets/Header'
import StreetsTable from '@common/components/Tables/Streets/Table'
import TableCard from '@common/components/UI/TableCard'

const StreetsBlock: React.FC<{
  domainId?: string
}> = ({ domainId }) => {
  
  return (
    <TableCard title={<StreetsHeader showAddButton />}>
      <StreetsTable domainId={domainId} />
    </TableCard>
  )
}

export default StreetsBlock
