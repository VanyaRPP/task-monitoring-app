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
import { useGetCustomServicesQuery } from '@common/api/customServicesApi/customServices.api'
import {
  useGetAddressFiltersQuery,
  useGetDateFiltersQuery,
  useGetDomainFiltersQuery,
  useGetRealEstateFiltersQuery,
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
  const { data: customServicesData } = useGetCustomServicesQuery({})
  const [filter, setFilter] = useState<IServiceFilter>()

  const domainFilteredCustomServices = useMemo(() => {
    if (!customServicesData?.data) return []
    const domainIds = filter?.domain as unknown as string[] | null | undefined
    if (!domainIds?.length) return customServicesData.data
    return customServicesData.data.filter((cs) =>
      domainIds.some((id) => String(cs.domain) === String(id))
    )
  }, [customServicesData?.data, filter?.domain])
  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.SERVICE

  const { data: domainsFilter } = useGetDomainFiltersQuery({
    streets: filter?.street,
    realEstates: filter?.company,
  })
  const { data: streetsFilter } = useGetAddressFiltersQuery({
    domains: filter?.domain,
    realEstates: filter?.company,
  })
  const { data: companiesFilter } = useGetRealEstateFiltersQuery({
    streets: filter?.street,
    domains: filter?.domain,
  })
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
    companyId: filter?.company || undefined,
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
            companiesFilter={companiesFilter}
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
