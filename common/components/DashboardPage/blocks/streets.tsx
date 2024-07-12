import { IStreet, IStreetFilter } from '@common/api/streetApi/street.api.types'
import StreetsHeader from '@common/components/Tables/Streets/Header'
import StreetsTable from '@common/components/Tables/Streets/Table'
import TableCard from '@common/components/UI/TableCard'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { AppRoutes } from '@utils/constants'
import { useGetAllStreetsQuery } from '@common/api/streetApi/street.api'
import { isAdminCheck } from '@utils/helpers'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'

const StreetsBlock: React.FC<{
  domainId?: string
}> = ({ domainId }) => {
  const { data: user } = useGetCurrentUserQuery()

  const [currentStreet, setCurrentStreet] = useState<IStreet>(null)
  const [streetActions, setStreetActions] = useState({
    edit: false,
    preview: false,
  })

  const [filter, setFilter] = useState<IStreetFilter>()
  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.STREETS

  const {
    data: streetsData,
    isLoading,
    isError,
  } = useGetAllStreetsQuery({
    limit: isOnPage ? 0 : 5,
    // streetId: filter?.street || undefined,
    domainId: filter?.domain || undefined,
  })

  return (
    <TableCard
      title={
        <StreetsHeader
          showAddButton={isAdminCheck(user?.roles)}
          currentStreet={currentStreet}
          setCurrentStreet={setCurrentStreet}
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
        streets={streetsData}
        isLoading={isLoading}
        isError={isError}
        filter={filter}
        setFilter={setFilter}
      />
    </TableCard>
  )
}

export default StreetsBlock
