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
import { useMemo, useState } from 'react'
import { useDeleteServiceMutation } from '@common/api/serviceApi/service.api'
import { message } from 'antd'
import { dateToMonthYear } from '@assets/features/formatDate'
import { useAccessibleCustomServices } from '@common/api/customServicesApi/useAccessibleCustomServices'
import {
  useGetAddressFiltersQuery,
  useGetDateFiltersQuery,
  useGetDomainFiltersQuery,
} from '@common/api/filterApi/filter.api'
import ModalDelete from '@components/UI/ModalDelete'
import type { ColumnsType } from 'antd/es/table'

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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const [deleteService] = useDeleteServiceMutation()
  // Backend-scoped catalog: for a DomainAdmin this is already only their
  // domains' services (resolveAccessScope), so no client-side security filter
  // is needed — only the presentational "selected domain" narrowing below.
  const { services: customServices } = useAccessibleCustomServices()
  const [filter, setFilter] = useState<IServiceFilter>()
  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.SERVICE

  const { data: domainsFilter } = useGetDomainFiltersQuery({
    streets: filter?.street,
  })
  const { data: streetsFilter } = useGetAddressFiltersQuery({
    domains: filter?.domain,
  })

  const domainFilteredCustomServices = useMemo(() => {
    const explicitDomainIds = filter?.domain as unknown as
      | string[]
      | null
      | undefined
    if (explicitDomainIds?.length) {
      return customServices.filter((cs) =>
        explicitDomainIds.some((id) => String(cs.domain) === String(id))
      )
    }
    return customServices
  }, [customServices, filter?.domain])
  const { data: dateFilters } = useGetDateFiltersQuery({
    type: 'service',
  })

  const handleDeleteConfirm = async () => {
    try {
      await Promise.all(
        selectedServices.map((service) => deleteService(service._id))
      )
      setSelectedServices([])
      setDeleteModalOpen(false)
      message.success('Видалено!')
    } catch {
      message.error('Помилка при видаленні рахунків')
    }
  }

  const deleteColumns: ColumnsType<IService> = [
    {
      title: 'Домен',
      dataIndex: ['domain', 'name'],
      key: 'domain',
    },
    {
      title: 'Адреса',
      dataIndex: ['street', 'address'],
      key: 'street',
    },
    {
      title: 'Період',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dateToMonthYear(date),
    },
  ]

  const {
    data: servicesData,
    isLoading,
    isFetching,
    isError,
  } = useGetAllServicesQuery({
    limit: isOnPage ? 0 : 5,
    streetId: filter?.street || undefined,
    domainId: sepDomainID || filter?.domain || undefined,
    year: filter?.year,
    month: filter?.month,
  })

  return (
    <>
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
            handleDeleteServices={() => setDeleteModalOpen(true)}
            selectedServices={selectedServices}
            user={user}
            domainsFilter={domainsFilter}
            streetsFilter={streetsFilter}
          />
        }
      >
        <ServicesTable
          setCurrentService={setCurrentService}
          setServiceActions={setServiceActions}
          serviceActions={serviceActions}
          services={servicesData}
          customServices={domainFilteredCustomServices}
          isLoading={isLoading || isFetching}
          isError={isError}
          filter={filter}
          setFilter={setFilter}
          setSelectedServices={setSelectedServices}
          user={user}
          domainsFilter={domainsFilter}
          streetsFilter={streetsFilter}
          dateFilters={dateFilters}
        />
      </TableCard>
      <ModalDelete
        open={deleteModalOpen}
        onCancel={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        data={selectedServices}
        columns={deleteColumns}
        rowKey={(service) => service._id}
      />
    </>
  )
}

export default ServicesBlock
