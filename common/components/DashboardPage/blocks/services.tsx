import { useState } from 'react'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import ServicesHeader from '@common/components/Tables/Services/Header'
import ServicesTable from '@common/components/Tables/Services/Table'
import TableCard from '@common/components/UI/TableCard'
import { isAdminCheck } from '@utils/helpers'
import { IExtendedService } from '@common/api/serviceApi/service.api.types'

const ServicesBlock = () => {
  const { data: user } = useGetCurrentUserQuery()
  const [currentService, setCurrentService] = useState<IExtendedService>(null)
  const [serviceActions, setServiceActions] = useState({
    edit: false,
    preview: false,
  })

  return (
    <TableCard
      title={
        <ServicesHeader
          showAddButton={isAdminCheck(user?.roles)}
          currentService={currentService}
          setCurrentService={setCurrentService}
          serviceActions={serviceActions}
          setServiceActions={setServiceActions}
        />
      }
    >
      <ServicesTable
        setCurrentService={setCurrentService}
        setServiceActions={setServiceActions}
        serviceActions={serviceActions}
      />
    </TableCard>
  )
}

export default ServicesBlock
