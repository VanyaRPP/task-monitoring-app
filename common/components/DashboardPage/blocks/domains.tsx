import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import DomainsHeader from '@components/Tables/Domains/Header'
import DomainsTable from '@components/Tables/Domains/Table'
import TableCard from '@components/UI/TableCard'
import { useState } from 'react'

export interface Props {
  domainId?: string
}

const DomainsBlock: React.FC<Props> = ({ domainId }) => {
  const [currentDomain, setCurrentDomain] = useState<IExtendedDomain>(null)
  const [domainActions, setDomainActions] = useState({
    edit: false,
  })
  const [dataLength, handleDomainsLength] = useState(0)

  return (
    <TableCard
      title={
        <DomainsHeader
          currentDomain={currentDomain}
          setCurrentDomain={setCurrentDomain}
          setDomainActions={setDomainActions}
          domainActions={domainActions}
        />
      }
      style={{
        maxHeight: dataLength * 145,
      }}
    >
      <DomainsTable
        domainId={domainId}
        setCurrentDomain={setCurrentDomain}
        setDomainActions={setDomainActions}
        domainActions={domainActions}
        handleDomainsLength={handleDomainsLength}
      />
    </TableCard>
  )
}

export default DomainsBlock
