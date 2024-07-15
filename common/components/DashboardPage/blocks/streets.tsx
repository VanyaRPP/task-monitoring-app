import { useGetAllStreetsQuery } from '@common/api/streetApi/street.api'
import { IStreet } from '@common/api/streetApi/street.api.types'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import StreetsHeader from '@common/components/Tables/Streets/Header'
import StreetsTable from '@common/components/Tables/Streets/Table'
import TableCard from '@common/components/UI/TableCard'
import { useState } from 'react'

const StreetsBlock: React.FC<{
  domainId?: string
}> = ({ domainId }) => {
  const { data: user } = useGetCurrentUserQuery()
  const [currentStreet, setCurrentStreet] = useState<IStreet>(null)
  const [streetActions, setStreetActions] = useState({
    edit: false,
    preview: false,
  })

  return (
    <TableCard title={<StreetsHeader showAddButton />}>
      <StreetsTable
        domainId={domainId}
        setCurrentStreet={setCurrentStreet}
        setStreetActions={setStreetActions}
        streetActions={streetActions}
        currentStreet={currentStreet}
      />
    </TableCard>
  )
}

export default StreetsBlock
