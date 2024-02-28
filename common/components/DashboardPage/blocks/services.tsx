import { useState } from 'react'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import ServicesHeader from '@common/components/Tables/Services/Header'
import ServicesTable from '@common/components/Tables/Services/Table'
import TableCard from '@common/components/UI/TableCard'
import { isAdminCheck } from '@utils/helpers'
import {IExtendedService, IServiceFilter} from '@common/api/serviceApi/service.api.types'
import { useRouter } from 'next/router'
import { AppRoutes } from '@utils/constants'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'

const ServicesBlock = () => {
  const { data: user } = useGetCurrentUserQuery()
  const [currentService, setCurrentService] = useState<IExtendedService>(null)
  const [serviceActions, setServiceActions] = useState({
    edit: false,
    preview: false,
  })
  const [filter, setFilter] = useState<IServiceFilter>()
  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.SERVICE

  const {
    data: servicesData,
    isLoading,
    isError,
  } = useGetAllServicesQuery({
    limit: isOnPage ? 0 : 5,
    streetId: filter?.street || undefined,
    domainId: filter?.domain || undefined,
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
          filter={filter}
          setFilter={setFilter}
          services={servicesData}
        />
      }
    >
      <ServicesTable
        setCurrentService={setCurrentService}
        setServiceActions={setServiceActions}
        serviceActions={serviceActions}
        services={servicesData}
        isLoading={isLoading}
        isError={isError}
        filter={filter}
        setFilter={setFilter}
      />
    </TableCard>
  )
}

export default ServicesBlock
