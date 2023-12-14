import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import ChartRoutHeader from '@common/components/Tables/CompaniesAreaChart/ChartRoutHeader'
import DomainsTable from '@common/components/Tables/Domains/Table'
import TableCard from '@common/components/UI/TableCard'
import { useState } from 'react'

export interface Props {
  domainId?: string
}

const ChartDomainBlock: React.FC<Props> = ({ domainId }) => {
  const [currentDomain, setCurrentDomain] = useState<IExtendedDomain>(null)

  return (
    <TableCard title={<ChartRoutHeader />}>
      <DomainsTable domainId={domainId} setCurrentDomain={setCurrentDomain} />
    </TableCard>
  )
}

export default ChartDomainBlock
