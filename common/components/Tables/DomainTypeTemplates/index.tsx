'use client'

import {
  useDeleteDomainTypeTemplateMutation,
  useGetDomainTypeTemplatesQuery,
} from '@common/api/domainApi/domain.api'
import { IDomainTypeTemplate } from '@common/api/domainApi/domain.api.types'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import {
  Button,
  Flex,
  Modal,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import React, { FC, useState } from 'react'
import { getDomainTypeTemplateCategoryLabel } from '@utils/domain/domain-type-template-categories'
import CreateTemplateModal from '@common/components/UI/DomainsComponents/DomainModal/DomainForm/DomainsServices/DomainModalType/CreateTemplateModal'
import EditTemplateModal from './EditTemplateModal'

export const DomainTypeTemplatesTable: FC = () => {
  const [includeArchived, setIncludeArchived] = useState(false)
  const { data: templates = [], isFetching } = useGetDomainTypeTemplatesQuery({
    includeArchived,
  })
  const [deleteTemplate, { isLoading: isDeleting }] =
    useDeleteDomainTypeTemplateMutation()

  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<IDomainTypeTemplate | null>(null)

  const handleDelete = (template: IDomainTypeTemplate) => {
    Modal.confirm({
      title: `Видалити «${template.name}»?`,
      content:
        'Якщо шаблон використовується доменами, він буде архівований. Якщо ні — видалений безповоротно.',
      okText: 'Видалити',
      okButtonProps: { danger: true },
      cancelText: 'Скасувати',
      onOk: async () => {
        try {
          const result = await deleteTemplate({
            _id: template._id,
            force: true,
          }).unwrap()
          if (result?.archived) {
            message.success(
              `Шаблон архівовано (використовують ${result.usageCount} доменів)`
            )
          } else {
            message.success('Шаблон видалено')
          }
        } catch (e: any) {
          const msg = e?.data?.message || 'Не вдалося видалити'
          message.error(msg)
        }
      },
    })
  }

  const columns: ColumnsType<IDomainTypeTemplate> = [
    {
      title: 'Назва',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, t) => (
        <span>
          {name}
          {t.archivedAt && (
            <Tag color="default" style={{ marginLeft: 8 }}>
              архів
            </Tag>
          )}
        </span>
      ),
    },
    {
      title: 'Категорія',
      dataIndex: 'category',
      key: 'category',
      width: 140,
      render: (cat: string) => getDomainTypeTemplateCategoryLabel(cat),
    },
    {
      title: 'Тип',
      key: 'kind',
      width: 100,
      render: (_, t) =>
        t.isBuiltIn ? <Tag color="blue">built-in</Tag> : <Tag>custom</Tag>,
    },
    {
      title: 'Груп',
      key: 'groups',
      width: 80,
      render: (_, t) => t.groups?.length ?? 0,
    },
    {
      title: 'Створено',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (v?: string) => (v ? new Date(v).toLocaleDateString() : '—'),
    },
    {
      title: '',
      key: 'actions',
      width: 96,
      render: (_, t) => (
        <Flex gap={4}>
          <Button
            size="small"
            icon={<EditOutlined />}
            disabled={t.isBuiltIn}
            onClick={() => setEditing(t)}
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            disabled={t.isBuiltIn}
            loading={isDeleting}
            onClick={() => handleDelete(t)}
          />
        </Flex>
      ),
    },
  ]

  return (
    <>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Шаблони типів
        </Typography.Title>
        <Flex gap={12} align="center">
          <span>
            Архівні{' '}
            <Switch
              size="small"
              checked={includeArchived}
              onChange={setIncludeArchived}
            />
          </span>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateOpen(true)}
          >
            Новий шаблон
          </Button>
        </Flex>
      </Flex>

      <Table
        rowKey="_id"
        size="small"
        loading={isFetching}
        columns={columns}
        dataSource={templates}
        pagination={false}
      />

      <CreateTemplateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => setCreateOpen(false)}
      />
      <EditTemplateModal
        open={!!editing}
        template={editing}
        onClose={() => setEditing(null)}
      />
    </>
  )
}

export default DomainTypeTemplatesTable
