import { IStreet } from '@common/api/streetApi/street.api.types'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import StreetsHeader from '@components/Tables/Streets/Header'
import StreetsTable from '@components/Tables/Streets/Table'
import TableCard from '@components/UI/TableCard'
import { useState } from 'react'

interface StreetBlockProps {
  domainId?: string;
}

const StreetsBlock: React.FC<StreetBlockProps> = ({ domainId }) => {
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
        />
      }
    >
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
