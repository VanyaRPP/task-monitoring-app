import {
  DeleteOutlined,
  EditOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons'
import { Alert, Button, Popconfirm, Table, Tag, Tooltip, message } from 'antd'
import { ColumnType } from 'antd/lib/table'
import { useRouter } from 'next/router'

import {
  useDeleteDomainMutation,
  useGetDomainsQuery,
} from '@common/api/domainApi/domain.api'
import StreetsBlock from '@common/components/DashboardPage/blocks/streets'
import { IDomain } from '@common/modules/models/Domain'
import { AppRoutes } from '@utils/constants'

export interface Props {
  domainId?: string
  setCurrentDomain?: (domain: IDomain) => void
}

const DomainsTable: React.FC<Props> = ({ domainId, setCurrentDomain }) => {
  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.DOMAIN

  const { data, isLoading, isError } = useGetDomainsQuery({
    domainId,
    limit: isOnPage ? 0 : 5,
  })

  const [deleteDomain, { isLoading: deleteLoading }] = useDeleteDomainMutation()

  const handleDelete = async (id: string) => {
    const response = await deleteDomain(id)
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
      columns={getDefaultColumns(handleDelete, deleteLoading, setCurrentDomain)}
      expandable={{
        expandedRowRender: ({ _id: domainId }) => (
          <StreetsBlock domainId={domainId} />
        ),
      }}
      dataSource={data?.data}
      scroll={{ x: 600 }}
    />
  )
}

const getDefaultColumns = (
  handleDelete?: (...args: any) => void,
  deleteLoading?: boolean,
  setCurrentDomain?: (domain: IDomain) => void
): ColumnType<any>[] => [
  {
    fixed: 'left',
    title: 'Назва',
    dataIndex: 'name',
    width: '25%',
  },
  {
    title: 'Адміністратори',
    dataIndex: 'adminEmails',
    render: (adminEmails) =>
      adminEmails.map((email) => <Tag key={email}>{email}</Tag>),
  },
  {
    align: 'center',
    title: 'Опис',
    dataIndex: 'description',
    width: 100,
    render: (text) => (
      <Tooltip title={text}>
        <QuestionCircleOutlined />
      </Tooltip>
    ),
  },
  {
    align: 'center',
    fixed: 'right',
    title: '',
    width: 50,
    render: (_, domain: IDomain) => (
      <Button
        style={{ padding: 0 }}
        type="link"
        onClick={() => setCurrentDomain(domain)}
      >
        <EditOutlined />
      </Button>
    ),
  },
  {
    align: 'center',
    fixed: 'right',
    title: '',
    dataIndex: '',
    width: 50,
    render: (_, domain: IDomain) => (
      <Popconfirm
        title={`Ви впевнені що хочете видалити ${
          domain.name ?? 'цей надавач послуг'
        }?`}
        onConfirm={() => handleDelete(domain?._id)}
        cancelText="Відміна"
        disabled={deleteLoading}
      >
        <DeleteOutlined />
      </Popconfirm>
    ),
  },
]

export default DomainsTable
