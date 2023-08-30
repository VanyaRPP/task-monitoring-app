import { DeleteOutlined } from '@ant-design/icons'
import { Alert, Checkbox, Popconfirm, Table, Tag, message } from 'antd'
import { ColumnType } from 'antd/lib/table'
import { useRouter } from 'next/router'

import {
  useDeleteRealEstateMutation,
  useGetAllRealEstateQuery,
} from '@common/api/realestateApi/realestate.api'
import { IExtendedRealestate } from '@common/api/realestateApi/realestate.api.types'
import { AppRoutes, Roles } from '@utils/constants'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'

export interface Props {
  domainId?: string
  streetId?: string
}

const CompaniesTable: React.FC<Props> = ({ domainId, streetId }) => {
  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.REAL_ESTATE

  const { data: userResponse } = useGetCurrentUserQuery()

  const { data, isLoading, isError } = useGetAllRealEstateQuery({
    domainId,
    streetId,
  })
  const [deleteRealEstate, { isLoading: deleteLoading }] =
    useDeleteRealEstateMutation()

  const handleDelete = async (id: string) => {
    const response = await deleteRealEstate(id)
    if ('data' in response) {
      message.success('Видалено!')
    } else {
      message.error('Помилка при видаленні')
    }
  }

  const isGlobalAdmin = userResponse?.roles?.includes(Roles.GLOBAL_ADMIN)

  const tableWidth =
    1800 +
    (isGlobalAdmin ? 50 : 0) +
    (!domainId && !streetId && !isLoading ? 400 : 0)

  if (isError) return <Alert message="Помилка" type="error" showIcon closable />

  return (
    <Table
      rowKey="_id"
      size="small"
      pagination={
        !isOnPage && {
          responsive: false,
          size: 'small',
          pageSize: 5,
          position: ['bottomCenter'],
          hideOnSinglePage: true,
        }
      }
      loading={isLoading}
      columns={getDefaultColumns(
        domainId,
        streetId,
        isLoading,
        handleDelete,
        deleteLoading,
        isGlobalAdmin
      )}
      dataSource={data}
      scroll={{ x: tableWidth }}
    />
  )
}

const getDefaultColumns = (
  domainId?: string,
  streetId?: string,
  isLoading?: boolean,
  handleDelete?: (...args: any) => void,
  deleteLoading?: boolean,
  isGlobalAdmin?: boolean
): ColumnType<any>[] => {
  const columns: ColumnType<any>[] = [
    {
      title: 'Адміністратори',
      dataIndex: 'adminEmails',
      width: 250,
      render: (adminEmails) =>
        adminEmails.map((email) => <Tag key={email}>{email}</Tag>),
    },
    {
      title: 'Опис',
      dataIndex: 'description',
      width: 350,
    },
    // TODO: enum
    {
      title: 'Кількість метрів',
      dataIndex: 'totalArea',
    },
    {
      title: 'Ціна за метр',
      dataIndex: 'pricePerMeter',
    },
    {
      title: 'Індивідуальне утримання за метр',
      dataIndex: 'servicePricePerMeter',
    },
    {
      title: 'Вивіз сміття',
      dataIndex: 'garbageCollector',
    },
    {
      title: 'Частка загальної площі',
      dataIndex: 'rentPart',
    },
    {
      title: 'Частка водопостачання',
      dataIndex: 'waterPart',
    },
    {
      align: 'center',
      title: 'Нарахування інд. інф.',
      dataIndex: 'inflicion',
      render: (value) => <Checkbox checked={value} disabled />,
    },
  ]

  if (isGlobalAdmin) {
    columns.push({
      align: 'center',
      fixed: 'right',
      title: '',
      dataIndex: '',
      width: 50,
      render: (_, realEstate: IExtendedRealestate) => (
        <Popconfirm
          title={`Ви впевнені що хочете видалити нерухомість?`}
          onConfirm={() => handleDelete(realEstate?._id)}
          cancelText="Відміна"
          disabled={deleteLoading}
        >
          <DeleteOutlined />
        </Popconfirm>
      ),
    })
  }

  if (!domainId && !streetId && !isLoading) {
    columns.unshift(
      {
        title: 'Домен',
        dataIndex: 'domain',
        width: 200,
        render: (i) => i?.name,
      },
      {
        title: 'Адреса',
        dataIndex: 'street',
        width: 200,
        render: (i) => (
          <>
            {i?.address} (м. {i?.city})
          </>
        ),
      }
    )
  }

  columns.unshift({
    fixed: 'left',
    title: 'Назва компанії',
    dataIndex: 'companyName',
    width: 200,
  })

  return columns
}

export default CompaniesTable
