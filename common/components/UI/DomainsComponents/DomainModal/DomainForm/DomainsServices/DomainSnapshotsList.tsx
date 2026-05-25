import { useGetCustomServicesQuery } from '@common/api/customServicesApi/customServices.api'
import {
  IDomainCustomServicesSnapshot,
  useDeleteDomainSnapshotMutation,
  useGetDomainSnapshotsQuery,
  useRestoreDomainSnapshotMutation,
} from '@common/api/domainSnapshotsApi/domain-snapshots.api'
import { DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Collapse, Empty, List, Modal, Tag, message } from 'antd'
import React, { FC, useMemo } from 'react'

interface Props {
  domainId?: string
  onRestored?: (snap: IDomainCustomServicesSnapshot) => void
}

const REASON_LABEL: Record<string, string> = {
  'template-switch': 'Заміна шаблону',
  manual: 'Ручне',
}

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

const DomainSnapshotsList: FC<Props> = ({ domainId, onRestored }) => {
  const { data: snapshots = [], isFetching } = useGetDomainSnapshotsQuery(
    { domainId: domainId as string, limit: 20 },
    { skip: !domainId }
  )
  const { data: catalogResponse } = useGetCustomServicesQuery({})
  const [restoreSnapshot, { isLoading: isRestoring }] =
    useRestoreDomainSnapshotMutation()
  const [deleteSnapshot, { isLoading: isDeleting }] =
    useDeleteDomainSnapshotMutation()

  const serviceNameById = useMemo(() => {
    const list: { _id: string; name: string }[] = Array.isArray(
      (catalogResponse as any)?.data
    )
      ? (catalogResponse as any).data
      : Array.isArray(catalogResponse)
        ? (catalogResponse as any)
        : []
    const map = new Map<string, string>()
    for (const s of list) map.set(String(s._id), s.name)
    return map
  }, [catalogResponse])

  if (!domainId) return null

  const handleRestore = (snap: IDomainCustomServicesSnapshot) => {
    Modal.confirm({
      title: 'Відновити цей знімок?',
      content:
        'Поточні налаштування послуг будуть перезаписані вмістом знімка. Можеш створити новий знімок поточного стану перед відновленням.',
      okText: 'Відновити',
      cancelText: 'Скасувати',
      onOk: async () => {
        try {
          await restoreSnapshot({
            _id: snap._id,
            domainId: snap.domainId,
          }).unwrap()
          message.success('Знімок відновлено')
          onRestored?.(snap)
        } catch (e: any) {
          message.error(e?.data?.message ?? 'Не вдалося відновити')
        }
      },
    })
  }

  const handleDelete = (snap: IDomainCustomServicesSnapshot) => {
    Modal.confirm({
      title: 'Видалити цей знімок?',
      okText: 'Видалити',
      okButtonProps: { danger: true },
      cancelText: 'Скасувати',
      onOk: async () => {
        try {
          await deleteSnapshot({
            _id: snap._id,
            domainId: snap.domainId,
          }).unwrap()
          message.success('Знімок видалено')
        } catch (e: any) {
          message.error(e?.data?.message ?? 'Не вдалося видалити')
        }
      },
    })
  }

  return (
    <Collapse
      style={{ marginBottom: 16 }}
      items={[
        {
          key: 'snapshots',
          label: `Історія налаштувань (${snapshots.length})`,
          children:
            snapshots.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Поки що немає"
              />
            ) : (
              <List
                size="small"
                loading={isFetching}
                dataSource={snapshots}
                renderItem={(snap) => {
                  const allServiceIds = snap.groups.flatMap(
                    (g) => g.services ?? []
                  )
                  const totalServices = allServiceIds.length
                  const PREVIEW = 3
                  const previewNames = allServiceIds
                    .slice(0, PREVIEW)
                    .map((id) => serviceNameById.get(String(id)) ?? id)
                  const remaining = totalServices - previewNames.length
                  const previewLine =
                    previewNames.length > 0
                      ? `${previewNames.join(', ')}${
                          remaining > 0 ? ` +${remaining}` : ''
                        }`
                      : 'без послуг'
                  return (
                    <List.Item
                      actions={[
                        <Button
                          key="restore"
                          size="small"
                          icon={<ReloadOutlined />}
                          loading={isRestoring}
                          onClick={() => handleRestore(snap)}
                        >
                          Відновити
                        </Button>,
                        <Button
                          key="delete"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          loading={isDeleting}
                          onClick={() => handleDelete(snap)}
                        />,
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <span>
                            <strong>
                              {snap.templateName?.trim() || 'Без шаблону'}
                            </strong>
                            <Tag color="default" style={{ marginLeft: 8 }}>
                              {REASON_LABEL[snap.reason] ?? snap.reason}
                            </Tag>
                          </span>
                        }
                        description={
                          <span style={{ fontSize: 12 }}>
                            {formatDate(snap.createdAt)} · {snap.groups.length}{' '}
                            груп · {totalServices} послуг
                            <br />
                            {previewLine}
                          </span>
                        }
                      />
                    </List.Item>
                  )
                }}
              />
            ),
        },
      ]}
    />
  )
}

export default DomainSnapshotsList
