import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import {
  IService,
  IServiceFilter,
} from '@common/api/serviceApi/service.api.types'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import {
  useGetAddressFiltersQuery,
  useGetDomainFiltersQuery,
} from '@common/api/filterApi/filter.api'
import ServicesHeader from '@components/Tables/Services/Header'
import ServicesTable from '@components/Tables/Services/Table'
import TableCard from '@components/UI/TableCard'
import { AppRoutes } from '@utils/constants'
import { isAdminCheck } from '@utils/helpers'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useDeleteServiceMutation } from '@common/api/serviceApi/service.api'
import { message, Modal } from 'antd'
import { dateToMonthYear } from '@assets/features/formatDate'

interface ServiceBlockProps {
  sepDomainID?: string
}

const ServicesBlock: React.FC<ServiceBlockProps> = ({ sepDomainID }) => {
  const { data: user } = useGetCurrentUserQuery()
  const [currentService, setCurrentService] = useState<IService>(null)
  const [serviceActions, setServiceActions] = useState({
    edit: false,
    preview: false,
  })
  const [selectedServices, setSelectedServices] = useState<IService[]>([])
  const [deleteService, _] = useDeleteServiceMutation()

  const handleDeleteServices = () => {
    ;(Modal as any).confirm({
      title: 'Ви впевнені, що хочете видалити обрані проплати?',
      cancelText: 'Ні',
      okText: 'Так',
      content: (
        <>
          {selectedServices.map((service, index) => (
            <div key={index}>
              {index + 1}. {service?.domain?.name}, {service?.street?.address},{' '}
              {dateToMonthYear(service.date)}
            </div>
          ))}
        </>
      ),
      onOk: async () => {
        try {
          await Promise.all(
            selectedServices.map((service) => deleteService(service._id))
          )
          setSelectedServices([])
          message.success('Видалено!')
        } catch (error) {
          message.error('Помилка при видаленні рахунків')
        }
      },
    })
  }

const [filter, setFilter] = useState<IServiceFilter>({
  domain: [],
  street: [],
  year: undefined,
  month: undefined,
})

  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.SERVICE
  const { data: domainsFilter } = useGetDomainFiltersQuery({
    streets: filter?.street,
  })
  const { data: streetsFilter } = useGetAddressFiltersQuery({
   domains: sepDomainID ? [sepDomainID] : filter?.domain,
  })

const { data: servicesData, isLoading, isError } = useGetAllServicesQuery({
  limit: isOnPage ? 0 : 5,
  streetIds: filter.street?.length ? filter.street : undefined, // ⬅ було streetId
  domainIds: sepDomainID ? [sepDomainID] : (filter.domain?.length ? filter.domain : undefined), // ⬅ було domainId
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
           services={{
            domainFilter: domainsFilter?.domainsFilter ?? [],
            addressFilter: streetsFilter?.streetsFilter ?? [],
          }}
          enableServiceButton={sepDomainID ? false : true}
          handleDeleteServices={handleDeleteServices}
          selectedServices={selectedServices}
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
        setSelectedServices={setSelectedServices}
        addressFilter={streetsFilter?.streetsFilter}
        domainFilter={domainsFilter?.domainsFilter}
      />
    </TableCard>
  )
}

export default ServicesBlock
