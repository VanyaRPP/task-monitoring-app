import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import DomainsHeader from '@components/Tables/Domains/Header'
import DomainsTable from '@components/Tables/Domains/Table'
import TableCard from '@components/UI/TableCard'
import { useState } from 'react'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'

export interface Props {
  domainId?: string
}

const DomainsBlock: React.FC<Props> = ({ domainId }) => {
  const { data: user } = useGetCurrentUserQuery()
  const { data: allDomains, isLoading: domainsLoading } = useGetDomainsQuery(
    { limit: domainId ? 5 : 0 },
    { skip: !!domainId }
  )

  const [currentDomain, setCurrentDomain] = useState<IExtendedDomain>(null)
  const [domainActions, setDomainActions] = useState({
    edit: false,
  })
  const [domainsLength, setDomainsLength] = useState(0)

  return (
    <TableCard
      title={
        <DomainsHeader
          currentDomain={currentDomain}
          setCurrentDomain={setCurrentDomain}
          setDomainActions={setDomainActions}
          domainActions={domainActions}
          user={user}
					allDomains={allDomains}
        />
      }
      style={{
        flexWrap: 'wrap',
      }}
    >
      <DomainsTable
        domainId={domainId}
        setCurrentDomain={setCurrentDomain}
        setDomainActions={setDomainActions}
        domainActions={domainActions}
        setDomainsLength={setDomainsLength}
				
      />
    </TableCard>
  )
}

export default DomainsBlock
