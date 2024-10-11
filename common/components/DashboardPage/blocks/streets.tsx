import { IStreet } from '@common/api/streetApi/street.api.types'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import StreetsHeader from '@components/Tables/Streets/Header'
import StreetsTable from '@components/Tables/Streets/Table'
import TableCard from '@components/UI/TableCard'
import { useState } from 'react'

const StreetsBlock: React.FC<{
  domainId?: string
  sepDomainId?: string
}> = ({ domainId, sepDomainId }) => {
  const { data: user } = useGetCurrentUserQuery()
  const [currentStreet, setCurrentStreet] = useState<IStreet>(null)
  const [streetActions, setStreetActions] = useState({
    edit: false,
    preview: false,
  })

  return (
    <TableCard
      title={
        <StreetsHeader
          showAddButton
          streetActions={streetActions}
          setStreetActions={setStreetActions}
          enableStreetsHeaderButton={sepDomainId ? false : true}
        />
      }
      style={{ maxHeight: '200px', minHeight: '100%', overflow: 'auto' }}
    >
      <StreetsTable
        domainId={domainId}
        setCurrentStreet={setCurrentStreet}
        setStreetActions={setStreetActions}
        streetActions={streetActions}
        currentStreet={currentStreet}
        sepDomainId={sepDomainId}
      />
    </TableCard>
  )
}

export default StreetsBlock
