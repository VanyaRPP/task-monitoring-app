import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { Alert, Popconfirm, Table, Tooltip, message, Button } from 'antd'
import { ColumnType } from 'antd/lib/table'
import { useRouter } from 'next/router'

import {
  useDeleteServiceMutation,
  useGetAllServicesQuery,
} from '@common/api/serviceApi/service.api'
import { IExtendedService } from '@common/api/serviceApi/service.api.types'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { AppRoutes, Roles } from '@utils/constants'
import { getFormattedDate, renderCurrency } from '@utils/helpers'

interface Props {
  setCurrentService: (setvice: IExtendedService) => void
}

const ServicesTable: React.FC<Props> = ({ setCurrentService }) => {
  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.SERVICE

  const { data, isLoading, isError } = useGetAllServicesQuery({limit: isOnPage ? 0 : 5})

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
        setCurrentService
      )}
      dataSource={data}
      scroll={{ x: 1500 }}
    />
  )
}

const getDefaultColumns = (
  isAdmin?: boolean,
  handleDelete?: (...args: any) => void,
  deleteLoading?: boolean,
  setCurrentService?: (service: IExtendedService) => void
): ColumnType<any>[] => {
  const columns: ColumnType<any>[] = [
    {
      fixed: 'left',
      title: 'Домен',
      dataIndex: 'domain',
      width: 200,
      render: (i) => i?.name,
    },
    {
      title: 'Адреса',
      dataIndex: 'street',
      render: (i) => `${i?.address} (м. ${i?.city})`,
    },
    {
      title: 'Місяць',
      dataIndex: 'date',
      width: 100,
      render: getFormattedDate,
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
    },
  ]

  if (isAdmin) {
    columns.push(
      {
        align: 'center',
        fixed: 'right',
        title: '',
        width: 50,
        render: (_, service: IExtendedService) => (
          <Button
            style={{ padding: 0 }}
            type="link"
            onClick={() => setCurrentService(service)}
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
        render: (_, service: IExtendedService) => (
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
