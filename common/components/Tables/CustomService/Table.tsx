import { DeleteOutlined, EditOutlined, CheckOutlined, CloseOutlined, PlusOutlined } from '@ant-design/icons'
import { Alert, Button, Popconfirm, Table, Input, message, Flex, Typography } from 'antd'
import { ColumnType } from 'antd/lib/table'
import { useState } from 'react'
import {
  useGetCustomServicesQuery,
  useDeleteCustomServiceMutation,
  useEditCustomServiceMutation,
  useCreateCustomServiceMutation,
} from '@common/api/customServicesApi/customServices.api'

interface ICustomService {
  _id: string
  name: string
  [key: string]: any
}

export const CustomServicesTable: React.FC = () => {
  const { data: response, isLoading, isError } = useGetCustomServicesQuery({})
  const [deleteService, { isLoading: deleteLoading }] = useDeleteCustomServiceMutation()
  const [editService, { isLoading: isUpdating }] = useEditCustomServiceMutation()
  const [createService, { isLoading: isCreating }] = useCreateCustomServiceMutation()

  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [tempName, setTempName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [newServiceName, setNewServiceName] = useState('')

  const services: ICustomService[] = Array.isArray((response as any)?.data)
    ? (response as any).data
    : Array.isArray(response)
    ? (response as any)
    : []

  const handleDelete = async (id: string) => {
    const res = await deleteService({ id })
    if ('data' in res) message.success('Видалено!')
    else message.error('Помилка при видаленні')
  }

  const handleStartEdit = (service: ICustomService) => {
    setEditingKey(service._id)
    setTempName(service.name)
  }

  const handleCancelEdit = () => {
    setEditingKey(null)
    setTempName('')
  }

  const handleSaveEdit = async (service: ICustomService) => {
    if (!tempName.trim()) return message.warning('Назва не може бути порожньою')
    if (tempName.trim() === service.name) return handleCancelEdit()
    try {
      await editService({ _id: service._id, name: tempName.trim() }).unwrap()
      message.success('Оновлено!')
      handleCancelEdit()
    } catch (error: any) {
      message.error(error?.data?.message || 'Помилка при оновленні')
    }
  }

  const handleCancelAdd = () => { setIsAdding(false); setNewServiceName('') }

  const handleAddService = async () => {
    if (!newServiceName.trim()) return message.warning('Назва не може бути порожньою')
    try {
      await createService({ name: newServiceName.trim(), domainId: '' }).unwrap()
      message.success('Створено!')
      handleCancelAdd()
    } catch (e: any) {
      message.error(e?.data?.message || 'Помилка при створенні')
    }
  }

  if (isError) return <Alert message="Помилка" type="error" showIcon closable />

  const columns: ColumnType<ICustomService>[] = [
    {
      title: 'Назва',
      dataIndex: 'name',
      render: (_, record) => editingKey === record._id ? (
        <Input
          size="small"
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          onPressEnter={() => handleSaveEdit(record)}
          onKeyDown={(e) => { if (e.key === 'Escape') handleCancelEdit() }}
          autoFocus
        />
      ) : record.name,
    },
    {
      align: 'center',
      fixed: 'right',
      width: 100,
      render: (_, record) => editingKey === record._id ? (
        <>
          <Button type="text" size="small" loading={isUpdating}
            icon={<CheckOutlined style={{ color: '#642AB5', stroke: '#642AB5', strokeWidth: 60 }} />}
            onClick={() => handleSaveEdit(record)}
          />
          <Button type="text" size="small" disabled={isUpdating}
            icon={<CloseOutlined style={{ strokeWidth: 60 }} />}
            onClick={handleCancelEdit}
          />
        </>
      ) : (
        <Button style={{ padding: 0 }} type="link" disabled={isUpdating || deleteLoading}
          onClick={() => handleStartEdit(record)}
        >
          <EditOutlined />
        </Button>
      ),
    },
    {
      align: 'center',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Popconfirm
          title={`Видалити послугу "${record.name}"?`}
          onConfirm={() => handleDelete(record._id)}
          cancelText="Відміна"
          disabled={deleteLoading || isUpdating}
        >
          <DeleteOutlined style={{ color: 'red' }} />
        </Popconfirm>
      ),
    },
  ]

  return (
    <>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>Послуги</Typography.Title>

        <div style={{ display: 'flex', gap: 8 }}>
          {isAdding ? (
            <>
              <Input
                size="small"
                placeholder="Назва послуги"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                onPressEnter={handleAddService}
                onKeyDown={(e) => { if (e.key === 'Escape') handleCancelAdd() }}
                style={{ height: 28 }}
                autoFocus
              />
              <Button type="text" size="small" loading={isCreating}
                icon={<CheckOutlined style={{ color: '#642AB5', stroke: '#642AB5', strokeWidth: 60 }} />}
                onClick={handleAddService}
              />
              <Button type="text" size="small" disabled={isCreating}
                icon={<CloseOutlined style={{ strokeWidth: 60 }} />}
                onClick={handleCancelAdd}
              />
            </>
          ) : (
            <Button type="primary" icon={<PlusOutlined />} disabled={isUpdating || deleteLoading}
              onClick={() => setIsAdding(true)}
              style={{ height: 28 }}
            >
              Додати послугу
            </Button>
          )}
        </div>
      </Flex>
      <Table
        rowKey="_id"
        loading={isLoading}
        dataSource={services}
        columns={columns}
        pagination={{
          position: ['bottomCenter'],
        }}
      />
    </>
  )
}