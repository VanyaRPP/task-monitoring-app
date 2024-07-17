import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons'
import { Alert, Button, Popconfirm, Table, Tooltip, message } from 'antd'
import { ColumnType } from 'antd/lib/table'
import { useRouter } from 'next/router'

import { IFilter } from '@common/api/paymentApi/payment.api.types'
import { useDeleteServiceMutation } from '@common/api/serviceApi/service.api'
import {
  IGetServiceResponse,
  IService,
} from '@common/api/serviceApi/service.api.types'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { dateToYear } from '@common/assets/features/formatDate'
import { AppRoutes, Roles } from '@utils/constants'
import { getFormattedDate, renderCurrency } from '@utils/helpers'

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
  setCurrentService: (setvice: IService) => void
  services: IGetServiceResponse
  isLoading?: boolean
  isError?: boolean
  filter?: any
  setFilter?: (filters: any) => void
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
}) => {
  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.SERVICE
  console.log(services)

  const { data: user } = useGetCurrentUserQuery()
  const isGlobalAdmin = user?.roles?.includes(Roles.GLOBAL_ADMIN)

  const [deleteService, { isLoading: deleteLoading }] =
    useDeleteServiceMutation()

  const handleDelete = async (id: string) => {
    const response = await deleteService(id)
    if ('data' in response) {
      message.success('Видалено!')
    } else {
      message.error('Помилка при видаленні')
    }
  }

  if (isError) return <Alert message="Помилка" type="error" showIcon closable />
  return (
    <Table
      rowKey="_id"
      size="small"
      pagination={false}
      loading={isLoading}
      columns={getDefaultColumns(
        isGlobalAdmin,
        handleDelete,
        deleteLoading,
        setCurrentService,
        services?.addressFilter,
        services?.domainFilter,
        filter,
        isOnPage,
        setServiceActions,
        serviceActions
      )}
      dataSource={services?.data}
      scroll={{ x: 1700 }}
      onChange={(__, filter) => {
        setFilter(filter)
      }}
    />
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
  // filters?: IFilter[],
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
      filters: isOnPage
        ? [
            {
              text: 'DomainName0',
              value: '64e71fd2b786a87e8eafb2ce',
            },
            {
              text: 'hello1',
              value: 'world1',
            },
          ]
        : null,
      filteredValue: filter?.domain || null,
      width: 200,
      render: (i) => i?.name,
    },
    {
      title: 'Рік',
      dataIndex: 'date',
      filters: isOnPage
        ? [
            {
              text: '2023',
              value: '2023',
            },
            {
              text: '2024',
              value: '2024',
            },
          ]
        : null,
      filteredValue: filter?.date || null,
      width: 200,
      render: (date) => dateToYear(date),
    },
    {
      title: 'Адреса',
      dataIndex: 'street',
      filters: isOnPage
        ? [
            {
              text: 'street1',
              value: '64e725a9a62fdf2d22b84c45',
            },
            {
              text: 'hello1',
              value: 'world1',
            },
          ]
        : null,
      filteredValue: filter?.street || null,
      render: (i) => `${i?.address} (м. ${i?.city})`,
    },
    {
      title: 'Місяць',
      dataIndex: 'date',
      width: 100,
      render: (date) => getFormattedDate(date),
    },
    {
      title: 'Утримання',
      dataIndex: 'rentPrice',
      width: 100,
      render: renderCurrency,
    },
    {
      title: 'Електрика',
      dataIndex: 'electricityPrice',
      width: 100,
      render: renderCurrency,
    },
    {
      title: 'Вода',
      dataIndex: 'waterPrice',
      width: 100,
      render: renderCurrency,
    },
    {
      title: 'Всього водопостачання',
      dataIndex: 'waterPriceTotal',
      width: 200,
      render: renderCurrency,
    },
    {
      title: 'Вивезення ТПВ',
      dataIndex: 'garbageCollectorPrice',
      width: 200,
      render: renderCurrency,
    },
    {
      title: (
        <Tooltip title="Індекс Інфляції">
          <span>Індекс</span>
        </Tooltip>
      ),
      width: 100,
      dataIndex: 'inflicionPrice',
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
