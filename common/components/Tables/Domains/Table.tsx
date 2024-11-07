import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons'
import { Alert, Button, Popconfirm, Table, Tag, Tooltip, message } from 'antd'
import { ColumnType } from 'antd/lib/table'
import { useRouter } from 'next/router'

import {
  useDeleteDomainMutation,
  useGetDomainsQuery,
} from '@common/api/domainApi/domain.api'
import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import StreetsBlock from '@components/DashboardPage/blocks/streets'
import { AppRoutes } from '@utils/constants'
import { useEffect } from 'react'

export interface Props {
  domainId?: string
  setCurrentDomain?: (domain: IExtendedDomain) => void
  setDomainActions: React.Dispatch<
    React.SetStateAction<{
      edit: boolean
    }>
  >
  domainActions: {
    edit: boolean
  }
  setDomainsLength: React.Dispatch<React.SetStateAction<number | null>>
}

const DomainsTable: React.FC<Props> = ({
  domainId,
  setCurrentDomain,
  setDomainActions,
  setDomainsLength,
}) => {
  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.DOMAIN

  const { data, isLoading, isError } = useGetDomainsQuery({
    domainId,
    limit: isOnPage ? 0 : 5,
  })

  useEffect(() => {
    if (!isLoading) {
      setDomainsLength(data?.length)
    }
  }, [data, isLoading])

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
      columns={getDefaultColumns(
        handleDelete,
        deleteLoading,
        setCurrentDomain,
        setDomainActions
      )}
      expandable={{
        expandedRowRender: ({ _id: domainId }) => (
          <StreetsBlock domainId={domainId} />
        ),
      }}
      dataSource={data}
      scroll={{ x: 600 }}
    />
  )
}

const getDefaultColumns = (
  handleDelete?: (...args: any) => void,
  deleteLoading?: boolean,
  setCurrentDomain?: (domain: IExtendedDomain) => void,
  setDomainActions?: React.Dispatch<
    React.SetStateAction<{
      edit: boolean
    }>
  >
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
    render: (_, domain: IExtendedDomain) => (
      <Button
        style={{ padding: 0 }}
        type="link"
        onClick={() => {
          setCurrentDomain(domain)
          setDomainActions({ edit: false })
        }}
      >
        <EyeOutlined />
      </Button>
    ),
  },
  {
    align: 'center',
    fixed: 'right',
    title: '',
    width: 50,
    render: (_, domain: IExtendedDomain) => (
      <Button
        style={{ padding: 0 }}
        type="link"
        onClick={() => {
          setCurrentDomain(domain)
          setDomainActions({ edit: true })
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
    dataIndex: '',
    width: 50,
    render: (_, domain: IExtendedDomain) => (
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
