import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import {
  useDeleteFeatureFlagMutation,
  useGetFeatureFlagsQuery,
  useUpdateFeatureFlagMutation,
} from '@common/api/featureFlagsApi/featureFlag.api'
import { IFeatureFlag } from '@common/api/featureFlagsApi/featureFlag.api.types'
import { Button, message, Space, Switch, Table } from 'antd'
import { useState } from 'react'

import FeatureFlagModal from '@common/components/Pages/Profile/Modal/AddFeatureFlagModal'

export const FeatureFlagsTable: React.FC = () => {
  const { data = [], isLoading } = useGetFeatureFlagsQuery()
  const [updateFlag, { isLoading: isUpdating }] = useUpdateFeatureFlagMutation()
  const [deleteFlag] = useDeleteFeatureFlagMutation()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const closeModal = () => {
    setIsModalOpen(false)
  }
  const [editingFlag, setEditingFlag] = useState<IFeatureFlag | null>(null)

  const onEdit = (flag: IFeatureFlag) => {
    setEditingFlag(flag)
    setIsModalOpen(true)
  }

  const onDelete = async (id: string) => {
    try {
      await deleteFlag(id).unwrap()
      message.success('Фічефлаг успішно видалено')
    } catch {
      message.error('Помилка при видаленні фічефлагу')
    }
  }

  return (
    <>
      <Table
        rowKey="_id"
        dataSource={data}
        loading={isLoading}
        pagination={{
          position: ['bottomCenter'],
        }}
        columns={[
          {
            title: 'Назва',
            dataIndex: 'name',
          },
          {
            title: 'Опис',
            dataIndex: 'description',
          },
          {
            title: 'Дата створення',
            dataIndex: 'createdAt',
            render: (value) => new Date(value).toLocaleDateString(),
          },
          {
            title: 'Статус',
            dataIndex: 'isEnabled',
            render: (isEnabled: boolean, record) => (
              <Switch
                checked={isEnabled}
                onChange={(checked) =>
                  updateFlag({ id: record._id, data: { isEnabled: checked } })
                }
              />
            ),
          },
          {
            title: 'Дії',
            render: (_, record) => (
              <Space size="middle">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => onEdit(record)}
                />
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  danger
                  onClick={() => onDelete(record._id)}
                />
              </Space>
            ),
          },
        ]}
      />
      <FeatureFlagModal
        open={isModalOpen}
        onClose={closeModal}
        initialData={editingFlag}
      />
    </>
  )
}
