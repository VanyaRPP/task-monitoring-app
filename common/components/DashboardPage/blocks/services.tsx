import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import {
  IService,
  IServiceFilter,
} from '@common/api/serviceApi/service.api.types'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import ServicesHeader from '@components/Tables/Services/Header'
import ServicesTable from '@components/Tables/Services/Table'
import TableCard from '@components/UI/TableCard'
import { AppRoutes } from '@utils/constants'
import { isAdminCheck } from '@utils/helpers'
import { useRouter } from 'next/router'
import { useState } from 'react'

interface ServiceBlockProps {
  sepDomainID?: string;
}

const ServicesBlock: React.FC<ServiceBlockProps> = ({sepDomainID}) => {
  const { data: user } = useGetCurrentUserQuery()
  const [currentService, setCurrentService] = useState<IService>(null)
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
    domainId: sepDomainID || filter?.domain || undefined,
    year: filter?.year,
    month: filter?.month,
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
          enableServiceButton={sepDomainID ? false : true}
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
