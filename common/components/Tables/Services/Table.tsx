import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons'
import { getFormattedDate } from '@assets/features/formatDate'
import { IFilter } from '@common/api/paymentApi/payment.api.types'
import { useDeleteServiceMutation } from '@common/api/serviceApi/service.api'
import {
  IGetServiceResponse,
  IService,
} from '@common/api/serviceApi/service.api.types'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { dateToYear } from '@common/assets/features/formatDate'
import { AppRoutes, Roles, ServiceName } from '@utils/constants'
import { isAdminCheck, renderCurrency } from '@utils/helpers'
import TableFilterLink from '@components/UI/Reusable/TableFilterLink'
import { Alert, Button, Popconfirm, Table, Tooltip, message } from 'antd'
import { ColumnType } from 'antd/lib/table'
import { useRouter } from 'next/router'
import React from 'react'
import { useCallback, useMemo, useState } from 'react'

interface Props {
  setServiceActions: React.Dispatch<
    React.SetStateAction<{
      edit: boolean
      preview: boolean
    }>
  >
  serviceActions: {
    edit: boolean
    preview: boolean
  }
  setCurrentService: (service: IService) => void
  services: IGetServiceResponse
  isLoading?: boolean
  isError?: boolean
  filter?: any
  setFilter?: (filters: any) => void
  setSelectedServices?: (service: IService[]) => void
  customServices?: { _id: string; name: string }[]
  user: any
  domainsFilter: any
  streetsFilter: any
  dateFilters: any
}

const ServicesTable: React.FC<Props> = ({
  setCurrentService,
  setServiceActions,
  serviceActions,
  services,
  isLoading,
  isError,
  filter,
  setFilter,
  setSelectedServices,
  customServices,
  user,
  domainsFilter,
  streetsFilter,
  dateFilters,
}) => {
  const router = useRouter()
  const { pathname } = router
  const [pageData, setPageData] = useState({
    pageSize: pathname === AppRoutes.SERVICE ? 10 : 5,
    currentPage: 1,
  })
  const isOnPage = pathname === AppRoutes.SERVICE

  const [deleteService, { isLoading: deleteLoading }] =
    useDeleteServiceMutation()

  const handleDelete = useCallback(
    async (id: string) => {
      const response = await deleteService(id)
      if ('data' in response) {
        message.success('Видалено!')
      } else {
        message.error('Помилка при видаленні')
      }
    },
    [deleteService]
  )

  const activeDomainIds = filter?.domain as string[] | null | undefined
  const activeStreetIds = filter?.street as string[] | null | undefined
  const activeYears = filter?.year as number[] | null | undefined
  const activeMonths = filter?.month as number[] | null | undefined

  const filteredData = useMemo(() => {
    let data = services?.data ?? []
    if (activeDomainIds?.length) {
      data = data.filter((s) =>
        activeDomainIds.some(
          (id) => String((s.domain as any)?._id) === String(id)
        )
      )
    }
    if (activeStreetIds?.length) {
      data = data.filter((s) =>
        activeStreetIds.some(
          (id) => String((s.street as any)?._id) === String(id)
        )
      )
    }
    if (activeYears?.length) {
      data = data.filter((s) =>
        activeYears.some((y) => new Date(s.date).getFullYear() === Number(y))
      )
    }
    if (activeMonths?.length) {
      data = data.filter((s) =>
        activeMonths.some((m) => new Date(s.date).getMonth() + 1 === Number(m))
      )
    }
    return data
  }, [
    services?.data,
    activeDomainIds,
    activeStreetIds,
    activeYears,
    activeMonths,
  ])

  const filteredCustomServices = customServices?.filter(
    (custom) =>
      !filteredData.some((service) =>
        service.customServices?.some((s) => String(s._id) === custom._id)
      )
  )

  if (isError) return <Alert message="Помилка" type="error" showIcon closable />

  const handlePagination = (page: number, pageSize: number) => {
    setPageData({ pageSize, currentPage: page })
  }

  return (
    <>
      <Table
        rowKey="_id"
        rowSelection={
          isAdminCheck(user?.roles) &&
          router.pathname === AppRoutes.SERVICE && {
            onChange: (_, selectedRows) => {
              setSelectedServices(selectedRows)
            },
          }
        }
        pagination={
          (router.pathname === AppRoutes.SERVICE ||
            router.pathname === AppRoutes.SEP_DOMAIN) && {
            total: services?.total,
            current: pageData.currentPage,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            position: ['bottomCenter'],
            onChange: handlePagination,
          }
        }
        loading={isLoading}
        columns={getDefaultColumns(
          isAdminCheck(user?.roles),
          handleDelete,
          deleteLoading,
          setCurrentService,
          streetsFilter?.streetsFilter,
          domainsFilter?.domainsFilter,
          dateFilters?.yearFilter,
          dateFilters?.monthFilter,
          filter,
          isOnPage,
          setServiceActions,
          serviceActions,
          filteredCustomServices,
          setFilter
        )}
        dataSource={filteredData}
        scroll={{ x: 1750 }}
        onChange={(__, filter) => {
          setFilter(filter)
        }}
      />
    </>
  )
}

const renderTooltip = (text: string) => {
  return (
    <Tooltip title={text} placement="top">
      <QuestionCircleOutlined />
    </Tooltip>
  )
}

const formatStreetValue = (address?: string, city?: string): string => {
  const trimmedAddress = address?.trim()
  const trimmedCity = city?.trim()

  if (!trimmedAddress && !trimmedCity) return '-'
  if (!trimmedAddress) return trimmedCity ? `м. ${trimmedCity}` : '-'
  if (!trimmedCity) return trimmedAddress

  return `${trimmedAddress} (м. ${trimmedCity})`
}

const getDefaultColumns = (
  isAdmin?: boolean,
  handleDelete?: (...args: any) => void,
  deleteLoading?: boolean,
  setCurrentService?: (service: IService) => void,
  addressFilter?: IFilter[],
  domainFilter?: IFilter[],
  yearFilter?: IFilter[],
  monthFilter?: IFilter[],
  filter?: any,
  isOnPage?: boolean,
  setServiceActions?: React.Dispatch<
    React.SetStateAction<{
      edit: boolean
      preview: boolean
    }>
  >,
  serviceActions?: {
    edit: boolean
    preview: boolean
  },
  customServices?: { _id: string; name: string }[],
  setFilter?: (filters: any) => void
): ColumnType<any>[] => {
  const columns: ColumnType<any>[] = [
    {
      fixed: 'left',
      title: 'Надавач послуг',
      dataIndex: 'domain',
      width: 180,
      filters: isOnPage ? domainFilter : null,
      filteredValue: filter?.domain || null,
      onFilter: (value, record) => String(record.domain?._id) === String(value),
      render: (i) =>
        isOnPage && setFilter ? (
          <TableFilterLink
            label={i?.name}
            filterKey="domain"
            filterId={i?._id}
            filters={filter}
            setFilters={setFilter}
          />
        ) : (
          i?.name
        ),
      filterSearch: true,
    },
    {
      title: 'Рік',
      dataIndex: 'year',
      width: 120,
      filters: isOnPage ? yearFilter : null,
      filteredValue: filter?.year || null,
      onFilter: (value, record) =>
        new Date(record.date).getFullYear() === Number(value),
      render: (_, record: IService) => dateToYear(record.date),
      filterSearch: true,
    },
    {
      title: 'Адреса',
      dataIndex: 'street',
      width: 250,
      filters: isOnPage ? addressFilter : null,
      filteredValue: filter?.street || null,
      onFilter: (value, record) => String(record.street?._id) === String(value),
      render: (i) => formatStreetValue(i?.address, i?.city),
      filterSearch: true,
    },
    {
      title: 'Місяць',
      dataIndex: 'month',
      width: 120,
      filters: isOnPage ? monthFilter : null,
      filteredValue: filter?.month || null,
      onFilter: (value, record) =>
        new Date(record.date).getMonth() + 1 === Number(value),
      render: (_, record: IService) => getFormattedDate(record.date),
      filterSearch: true,
    },
    {
      title: ServiceName.maintenancePrice,
      dataIndex: 'rentPrice',
      width: 120,
      ellipsis: true,
      render: renderCurrency,
      sorter: isOnPage
        ? (a, b) => a.maintenancePrice - b.maintenancePrice
        : null,
    },
    {
      title: ServiceName.electricityPrice,
      dataIndex: 'electricityPrice',
      width: 120,
      ellipsis: true,
      render: renderCurrency,
      sorter: isOnPage
        ? (a, b) => a.electricityPrice - b.electricityPrice
        : null,
    },
    {
      title: ServiceName.waterPrice,
      dataIndex: 'waterPrice',
      width: 120,
      ellipsis: true,
      render: renderCurrency,
      sorter: isOnPage ? (a, b) => a.waterPrice - b.waterPrice : null,
    },
    {
      title: ServiceName.waterPart,
      dataIndex: 'waterPriceTotal',
      width: 120,
      ellipsis: true,
      render: renderCurrency,
      sorter: isOnPage ? (a, b) => a.waterPart - b.waterPart : null,
    },
    {
      title: ServiceName.garbageCollectorPrice,
      dataIndex: 'garbageCollectorPrice',
      width: 120,
      ellipsis: true,
      render: renderCurrency,
      sorter: isOnPage
        ? (a, b) => a.garbageCollectorPrice - b.garbageCollectorPrice
        : null,
    },
    {
      title: ServiceName.inflicionPrice,
      width: 120,
      ellipsis: true,
      dataIndex: 'inflicionPrice',
      sorter: isOnPage ? (a, b) => a.inflicionPrice - b.inflicionPrice : null,
    },
    {
      title: 'Опис',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 100,
      align: 'center',
      render: renderTooltip,
    },
    {
      align: 'center',
      fixed: 'right',
      title: '',
      width: 50,
      render: (_, service: IService) => (
        <Button
          style={{ padding: 0 }}
          type="link"
          onClick={() => {
            setCurrentService(service)
            setServiceActions({ ...serviceActions, preview: true })
          }}
        >
          <EyeOutlined />
        </Button>
      ),
    },
  ]

  if (customServices?.length) {
    customServices.forEach((custom) => {
      columns.splice(columns.length - 2, 0, {
        title: custom.name,
        dataIndex: custom._id,
        width: 120,
        ellipsis: true,
        render: (_, record: IService) => {
          const match = record.customServices?.find(
            (s) => String(s._id) === String(custom._id)
          )
          return match ? renderCurrency(match.price) : '-'
        },
      })
    })
  }

  if (isAdmin) {
    columns.push(
      {
        align: 'center',
        fixed: 'right',
        title: '',
        width: 50,
        render: (_, service: IService) => (
          <Button
            style={{ padding: 0 }}
            type="link"
            onClick={() => {
              setCurrentService(service)
              setServiceActions({ ...serviceActions, edit: true })
            }}
          >
            <EditOutlined />
          </Button>
        ),
      },
      {
        align: 'center',
        fixed: 'right',
        title: '',
        width: 50,
        render: (_, service: IService) => (
          <Popconfirm
            title={`Ви впевнені що хочете видалити послугу за місяць ${getFormattedDate(
              service.date
            )}?`}
            onConfirm={() => handleDelete(service?._id)}
            cancelText="Відміна"
            disabled={deleteLoading}
          >
            <DeleteOutlined />
          </Popconfirm>
        ),
      }
    )
  }

  return columns
}

export default React.memo(ServicesTable)
