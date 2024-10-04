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
import { Alert, Button, Popconfirm, Table, Tooltip, message } from 'antd'
import { ColumnType } from 'antd/lib/table'
import { useRouter } from 'next/router'
import { useCallback, useState } from 'react'

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
}) => {
  const router = useRouter()
  const { pathname } = router
  const [pageData, setPageData] = useState({
    pageSize: pathname === AppRoutes.SERVICE ? 10 : 5,
    currentPage: 1,
  })
  const isOnPage = pathname === AppRoutes.SERVICE

  const { data: user } = useGetCurrentUserQuery()
  const isGlobalAdmin = user?.roles?.includes(Roles.GLOBAL_ADMIN)

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

  if (isError) return <Alert message="Помилка" type="error" showIcon closable />

  const handlePagination = (pagination) => {
    setPageData({
      pageSize: pagination.pageSize,
      currentPage: pagination.current,
    })
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
          isGlobalAdmin,
          handleDelete,
          deleteLoading,
          setCurrentService,
          services?.addressFilter,
          services?.domainFilter,
          services?.yearFilter,
          services?.monthFilter,
          filter,
          isOnPage,
          setServiceActions,
          serviceActions
        )}
        dataSource={services?.data}
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
  }
): ColumnType<any>[] => {
  const columns: ColumnType<any>[] = [
    {
      fixed: 'left',
      title: 'Надавач послуг',
      dataIndex: 'domain',
      filters: isOnPage ? domainFilter : null,
      filteredValue: filter?.domain || null,
      render: (i) => i?.name,
      filterSearch: true,
    },
    {
      title: 'Рік',
      dataIndex: 'year',
      width: 120,
      filters: isOnPage ? yearFilter : null,
      filteredValue: filter?.year || null,
      render: (_, record: IService) => dateToYear(record.date),
      filterSearch: true,
    },
    {
      title: 'Адреса',
      dataIndex: 'street',
      filters: isOnPage ? addressFilter : null,
      filteredValue: filter?.street || null,
      render: (i) => `${i?.address} (м. ${i?.city})`,
      filterSearch: true,
    },
    {
      title: 'Місяць',
      dataIndex: 'month',
      width: 120,
      filters: isOnPage ? monthFilter : null,
      filteredValue: filter?.month || null,
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

export default ServicesTable
