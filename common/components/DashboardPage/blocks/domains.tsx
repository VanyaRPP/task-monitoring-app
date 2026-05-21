import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import DomainsHeader from '@components/Tables/Domains/Header'
import DomainsTable from '@components/Tables/Domains/Table'
import TableCard from '@components/UI/TableCard'
import { useState } from 'react'
import { Radio } from 'antd'

export interface Props {
  domainId?: string
}

const DomainsBlock: React.FC<Props> = ({ domainId }) => {
  const [currentDomain, setCurrentDomain] = useState<IExtendedDomain | null>(
    null
  )
  const [domainActions, setDomainActions] = useState({
    edit: false,
  })
  const [domainsLength, setDomainsLength] = useState(0)
  const [isArchive, setIsArchive] = useState<boolean>(false)

  return (
    <TableCard
      title={
        <DomainsHeader
          currentDomain={currentDomain}
          setCurrentDomain={setCurrentDomain}
          setDomainActions={setDomainActions}
          domainActions={domainActions}
        >
          <Radio.Group
            value={isArchive}
            onChange={(e) => setIsArchive(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value={false}>Неархівовані</Radio.Button>
            <Radio.Button value={true}>Архівовані</Radio.Button>
          </Radio.Group>
        </DomainsHeader>
      }
      style={{ flexWrap: 'wrap' }}
    >
      <DomainsTable
        domainId={domainId}
        isArchive={isArchive}
        setCurrentDomain={setCurrentDomain}
        setDomainActions={setDomainActions}
        domainActions={domainActions}
        setDomainsLength={setDomainsLength}
      />
    </TableCard>
  )
}

export default DomainsBlock
