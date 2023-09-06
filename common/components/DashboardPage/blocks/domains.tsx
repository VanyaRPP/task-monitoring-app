import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import DomainsHeader from '@common/components/Tables/Domains/Header'
import DomainsTable from '@common/components/Tables/Domains/Table'
import TableCard from '@common/components/UI/TableCard'
import { useState } from 'react'

export interface Props {
  domainId?: string
}

const DomainsBlock: React.FC<Props> = ({ domainId }) => {
  const [currentDomain, setCurrentDomain] = useState<IExtendedDomain>(null)

  return (
    <TableCard title={<DomainsHeader currentDomain={currentDomain} setCurrentDomain={setCurrentDomain} />}>
      <DomainsTable domainId={domainId} setCurrentDomain={setCurrentDomain} />
    </TableCard>
  )
}

export default DomainsBlock
