import DomainsHeader from '@common/components/Tables/Domains/Header'
import DomainsTable from '@common/components/Tables/Domains/Table'
import TableCard from '@common/components/UI/TableCard'
import { IDomain } from '@common/modules/models/Domain'
import { useState } from 'react'

export interface Props {
  domainId?: string
}

const DomainsBlock: React.FC<Props> = ({ domainId }) => {
  const [currentDomain, setCurrentDomain] = useState<IDomain>(null)

  return (
    <TableCard
      title={
        <DomainsHeader
          currentDomain={currentDomain}
          setCurrentDomain={setCurrentDomain}
        />
      }
    >
      <DomainsTable domainId={domainId} setCurrentDomain={setCurrentDomain} />
    </TableCard>
  )
}

export default DomainsBlock
