import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  QuestionCircleOutlined,
  InboxOutlined,
  MoreOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Popconfirm,
  Table,
  Tag,
  Tooltip,
  message,
  Dropdown,
} from 'antd'
import { ColumnType } from 'antd/lib/table'
import { useRouter } from 'next/router'
import { useEffect, useMemo } from 'react'

import {
  useDeleteDomainMutation,
  useGetDomainsQuery,
  useEditDomainMutation,
} from '@common/api/domainApi/domain.api'
import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import StreetsBlock from '@components/DashboardPage/blocks/streets'
import { AppRoutes } from '@utils/constants'

export interface Props {
  domainId?: string
  setCurrentDomain?: (domain: IExtendedDomain) => void
  setDomainActions?: React.Dispatch<React.SetStateAction<{ edit: boolean }>>
  domainActions?: { edit: boolean }
  setDomainsLength?: React.Dispatch<React.SetStateAction<number | null>>
  isArchive: boolean
}

const DomainsTable: React.FC<Props> = ({
  domainId,
  setCurrentDomain,
  setDomainActions,
  setDomainsLength,
  isArchive,
}) => {
  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.DOMAIN

  const { data, isLoading, isError } = useGetDomainsQuery({
    domainId,
    limit: isOnPage ? 0 : 5,
    archived: isArchive,
  })

  const filteredData = useMemo(() => {
    if (!data) return []
    return data.filter((domain) =>
      isArchive ? domain.archived === true : !domain.archived
    )
  }, [data, isArchive])

  useEffect(() => {
    if (!isLoading && setDomainsLength) {
      setDomainsLength(filteredData.length)
    }
  }, [filteredData, isLoading, setDomainsLength])

  const [deleteDomain, { isLoading: deleteLoading }] = useDeleteDomainMutation()
  const [updateDomain, { isLoading: archiveLoading }] = useEditDomainMutation()

  const handleDelete = async (id: string) => {
    const response = await deleteDomain(id)
    if ('data' in response) {
      message.success('Видалено!')
    } else {
      message.error('Помилка при видаленні')
    }
  }

  const handleArchive = async (id: string, archived: boolean) => {
    try {
      const response = await updateDomain({ _id: id, archived })
      if ('data' in response) {
        message.success(archived ? 'Домен архівовано' : 'Домен розархівовано')
      } else {
        message.error('Помилка при зміні статусу')
      }
    } catch (error) {
      message.error('Виникла помилка')
    }
  }

  if (isError) return <Alert message="Помилка" type="error" showIcon closable />

  return (
    <Table
      rowKey="_id"
      pagination={false}
      loading={isLoading}
      columns={getDefaultColumns({
        handleDelete,
        deleteLoading,
        setCurrentDomain,
        setDomainActions,
        handleArchive,
        archiveLoading,
      })}
      expandable={{
        expandedRowRender: ({ _id: domainId }) => (
          <StreetsBlock domainId={domainId} />
        ),
      }}
      dataSource={filteredData}
      scroll={{ x: 600 }}
    />
  )
}

const getDefaultColumns = ({
  handleDelete,
  deleteLoading,
  setCurrentDomain,
  setDomainActions,
  handleArchive,
  archiveLoading,
}: {
  handleDelete: (id: string) => void
  deleteLoading: boolean
  setCurrentDomain?: (domain: IExtendedDomain) => void
  setDomainActions?: React.Dispatch<React.SetStateAction<{ edit: boolean }>>
  handleArchive: (id: string, archived: boolean) => void
  archiveLoading: boolean
}): ColumnType<any>[] => [
  {
    fixed: 'left',
    title: 'Назва',
    dataIndex: 'name',
    width: '25%',
  },
  {
    title: 'Адміністратори',
    dataIndex: 'adminEmails',
    render: (adminEmails: string[]) =>
      adminEmails?.map((email) => <Tag key={email}>{email}</Tag>),
  },
  {
    align: 'center',
    title: 'Опис',
    dataIndex: 'description',
    width: 100,
    render: (text) => (
      <Tooltip
        title={
          <div style={{ whiteSpace: 'pre-line', maxWidth: 300 }}>{text}</div>
        }
        overlayStyle={{ maxWidth: 800 }}
      >
        <QuestionCircleOutlined />
      </Tooltip>
    ),
  },
  {
    align: 'center',
    fixed: 'right',
    title: '',
    width: 150,
    render: (_, domain: IExtendedDomain) => (
      <div
        style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Button
          style={{ padding: 0 }}
          type="link"
          onClick={() => {
            if (setCurrentDomain) setCurrentDomain(domain)
            if (setDomainActions) setDomainActions({ edit: false })
          }}
        >
          <EyeOutlined />
        </Button>
        <Button
          style={{ padding: 0 }}
          type="link"
          onClick={() => {
            if (setCurrentDomain) setCurrentDomain(domain)
            if (setDomainActions) setDomainActions({ edit: true })
          }}
        >
          <EditOutlined />
        </Button>
        <Dropdown
          menu={{
            items: [
              {
                key: 'archive',
                label: (
                  <Popconfirm
                    title={`Ви впевнені, що хочете ${
                      domain.archived ? 'розархівувати' : 'архівувати'
                    } цей домен?`}
                    onConfirm={(e) => {
                      e?.stopPropagation()
                      handleArchive(domain._id, !domain.archived)
                    }}
                    onCancel={(e) => e?.stopPropagation()}
                    disabled={archiveLoading}
                    okText={domain.archived ? 'Розархівувати' : 'Архівувати'}
                    cancelText="Ні"
                  >
                    <Button
                      type="text"
                      icon={<InboxOutlined />}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: '4px 8px',
                        color: domain.archived ? '#722ed1' : '#ff4d4f',
                      }}
                    >
                      {domain.archived ? 'Розархівувати' : 'Архівувати'}
                    </Button>
                  </Popconfirm>
                ),
              },
              {
                key: 'delete',
                label: (
                  <Popconfirm
                    title="Ви впевнені, що хочете видалити домен?"
                    onConfirm={(e) => {
                      e?.stopPropagation()
                      handleDelete(domain._id)
                    }}
                    onCancel={(e) => e?.stopPropagation()}
                    disabled={deleteLoading}
                    okText="Видалити"
                    cancelText="Ні"
                  >
                    <Button
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={(e) => e.stopPropagation()}
                      style={{ padding: '4px 8px', color: '#ff4d4f' }}
                    >
                      Видалити
                    </Button>
                  </Popconfirm>
                ),
              },
            ],
          }}
          placement="bottomRight"
        >
          <Button style={{ padding: 0 }} type="link">
            <MoreOutlined />
          </Button>
        </Dropdown>
      </div>
    ),
  },
]

export default DomainsTable
