import React, { FC, useEffect, useState } from 'react'
import {
  Modal,
  Transfer,
  Typography,
  Button,
  Card,
  Space,
  Input,
  message,
  Collapse,
  Popconfirm,
} from 'antd'
import type { CollapseProps } from 'antd'
import {
  DeleteOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import {
  useDeleteCustomServiceMutation,
  useEditCustomServiceMutation,
} from '@common/api/customServicesApi/customServices.api'
import { Roles } from '@utils/constants'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { isAdminCheck, isProtectedService } from '@utils/helpers'

const { Text } = Typography

export type ServiceItem = {
  key: string
  title: string
}

interface ServiceGroup {
  groupName: string
  services: string[]
}

export interface IDomainServiceGroupSavePayload {
  groupName: string
  services: string[]
}

interface Props {
  open: boolean
  onClose: () => void
  data: ServiceItem[]
  serviceGroups: ServiceGroup[]
  onSave: (orderedGroups: IDomainServiceGroupSavePayload[]) => void
  onCreateCustomService: (name: string) => Promise<any>
  onDeleteCustomService?: (serviceKey: string) => void
  onUpdateCustomService?: (id: string, newTitle: string) => Promise<void>
  isGlobalAdmin?: boolean
  domainId?: string
  editable?: boolean
}

const DomainModal: FC<Props> = ({
  open,
  onClose,
  data,
  serviceGroups,
  onSave,
  onCreateCustomService,
  onDeleteCustomService,
  onUpdateCustomService,
  isGlobalAdmin,
  domainId,
  editable = true,
}) => {
  const [targetKeys, setTargetKeys] = useState<Record<string, string[]>>({})
  const [localServiceGroups, setLocalServiceGroups] = useState<ServiceGroup[]>([])
  const [localData, setLocalData] = useState<ServiceItem[]>([])
  const [newGroupName, setNewGroupName] = useState('')
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [tempTitle, setTempTitle] = useState('')
  const [newServiceName, setNewServiceName] = useState('')
  const [activePanel, setActivePanel] = useState<string | string[]>([])
  const { data: user } = useGetCurrentUserQuery()
  
  isGlobalAdmin = user?.roles?.includes(Roles.GLOBAL_ADMIN)
  const isAdmin = isAdminCheck(user?.roles)

  useEffect(() => {
    const initialTargets: Record<string, string[]> = {}

    serviceGroups.forEach((g) => {
      initialTargets[g.groupName] = (g.services || []).map(String)
    })

    setTargetKeys(initialTargets)
    setLocalServiceGroups(serviceGroups)
  }, [open])

  useEffect(() => {
    setLocalData(data)
  }, [data])

  const handleChange = (
    groupName: string,
    keys: (string | number | bigint)[]
  ) => {
    const stringKeys = keys.map(String)
    setTargetKeys((prev) => ({ ...prev, [groupName]: stringKeys }))
    setLocalServiceGroups((prev) =>
      prev.map((group) =>
        group.groupName === groupName
          ? { ...group, services: stringKeys }
          : group
      )
    )
  }

  const [deleteCustomService, { isLoading: isDeleting }] =
    useDeleteCustomServiceMutation()

  const [editCustomService, { isLoading: isUpdating }] =
    useEditCustomServiceMutation()

  const handleDeleteService = async (serviceKey: string) => {
    try {
      const result = await deleteCustomService({
        id: serviceKey,
        ...(domainId ? { domainId } : {}),
      }).unwrap()

      message.success(result.data || 'Сервіс успішно видалено')

      setTargetKeys((prev) => {
        const updated: Record<string, string[]> = {}
        Object.entries(prev).forEach(([group, keys]) => {
          updated[group] = keys.filter((k) => k !== serviceKey)
        })
        return updated
      })

      setLocalServiceGroups((prev) =>
        prev.map((group) => ({
          ...group,
          services: group.services.filter((s) => s !== serviceKey),
        }))
      )

      onDeleteCustomService?.(serviceKey)
    } catch (error: any) {
      message.error(error?.data?.message || 'Помилка при видаленні')
    }
  }

  const getFilteredData = (groupName: string): ServiceItem[] => {
    const usedKeys = new Set<string>()

    Object.entries(targetKeys).forEach(([gName, keys]) => {
      if (gName !== groupName) {
        keys.forEach((k) => usedKeys.add(k))
      }
    })

    return localData.filter(
      (item) =>
        !usedKeys.has(item.key) ||
        (targetKeys[groupName] || []).includes(item.key)
    )
  }

  const handleStartEdit = (item: ServiceItem) => {
    setEditingKey(item.key)
    setTempTitle(item.title)
  }

  const handleCancelEdit = () => {
    setEditingKey(null)
    setTempTitle('')
  }

  const handleSaveEdit = async (item: ServiceItem) => {
    if (!tempTitle.trim()) {
      message.warning('Назва не може бути порожньою')
      return
    }

    if (tempTitle.trim() === item.title) {
      handleCancelEdit()
      return
    }

    try {
      await editCustomService({
        _id: item.key,
        name: tempTitle.trim(),
        ...(domainId ? { domainId } : {}),
      }).unwrap()

      message.success('Назву послуги оновлено')
      handleCancelEdit()
    } catch (error: any) {
      message.error(error?.data?.message || 'Не вдалося оновити назву')
    }
  }

  const handleSaveNewGroup = () => {
    if (!newGroupName.trim()) {
      message.warning('Введіть назву групи')
      return
    }
    if (localServiceGroups.some((group) => group.groupName === newGroupName)) {
      message.warning('Група з такою назвою вже існує')
      return
    }

    const newGroup: ServiceGroup = {
      groupName: newGroupName,
      services: [],
    }

    const updatedGroups = [...localServiceGroups, newGroup]
    setLocalServiceGroups(updatedGroups)

    const newTargetKeys = { ...targetKeys, [newGroupName]: [] }
    setTargetKeys(newTargetKeys)

    setNewGroupName('')
    setActivePanel([])
  }

  const handleSaveNewService = async () => {
    if (!newServiceName.trim()) {
      message.warning('Введіть назву послуги')
      return
    }

    try {
      await onCreateCustomService(newServiceName)
      message.success('Кастомна послуга додана')

      setNewServiceName('')
      setActivePanel([])
    } catch (err: any) {
      console.error('Помилка створення послуги:', err)

      const isConflict =
        err?.status === 409 ||
        err?.originalStatus === 409 ||
        err?.data?.message?.toLowerCase().includes('вже існує')

      if (isConflict) {
        message.warning('Послуга з такою назвою вже існує')
      } else {
        message.error('Помилка при додаванні послуги')
      }
    }
  }

  const handleCancelNewGroup = () => {
    setNewGroupName('')
    setActivePanel([])
  }

  const handleCancelNewService = () => {
    setNewServiceName('')
    setActivePanel([])
  }

  const handleRemoveGroup = (groupName: string) => {
    const updatedGroups = localServiceGroups.filter(
      (g) => g.groupName !== groupName
    )
    setLocalServiceGroups(updatedGroups)

    const newTargetKeys = { ...targetKeys }
    delete newTargetKeys[groupName]
    setTargetKeys(newTargetKeys)
  }

  const renderTransfer = (groupName: string) => (
    <div style={{ position: 'relative' }}>
      <Transfer
        dataSource={getFilteredData(groupName)}
        titles={['Доступні послуги', 'Обрані послуги']}
        targetKeys={targetKeys[groupName] || []}
        onChange={(keys) => handleChange(groupName, keys)}
        disabled={!editable}
        listStyle={{
          width: '55%',
          height: 300,
          overflow: 'auto',
        }}
        render={(item) => {
          const isEditing = editingKey === item.key
          const isCustom = !isProtectedService(item.key)

          return (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                gap: 4,
              }}
            >
              {isEditing ? (
                <Input
                  size="small"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onPressEnter={() => handleSaveEdit(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') handleCancelEdit()
                  }}
                  autoFocus
                  style={{ flex: 1 }}
                />
              ) : (
                <Text
                  strong
                  ellipsis={{ tooltip: { title: item.title, placement: 'top' } }}
                  style={{ display: 'block', flex: 1, minWidth: 0 }}
                >
                  {item.title}
                </Text>
              )}

              <Space size="small">
                {editable && isCustom && isAdmin && (isGlobalAdmin || !!domainId) && (
                  <>
                    {isEditing ? (
                      <>
                        <Button
                          type="text"
                          size="small"
                          icon={
                            <CheckOutlined
                              style={{
                                color: '#642AB5',
                                stroke: '#642AB5',
                                strokeWidth: 60,
                              }}
                            />
                          }
                          onClick={() => handleSaveEdit(item)}
                          loading={isUpdating}
                        />
                        <Button
                          type="text"
                          size="small"
                          icon={
                            <CloseOutlined
                              style={{
                                stroke: 'currentColor',
                                strokeWidth: 60,
                              }}
                            />
                          }
                          onClick={handleCancelEdit}
                          disabled={isUpdating}
                        />
                      </>
                    ) : (
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleStartEdit(item)}
                        disabled={isUpdating || isDeleting}
                      />
                    )}
                    <Popconfirm
                      title="Видалити послугу?"
                      onConfirm={() => handleDeleteService(item.key)}
                      okText="Так"
                      cancelText="Ні"
                      disabled={isDeleting || isUpdating}
                    >
                      <DeleteOutlined
                        style={{
                          color: isDeleting || isUpdating ? '#ccc' : 'red',
                          cursor: 'pointer',
                        }}
                      />
                    </Popconfirm>
                  </>
                )}
              </Space>
            </div>
          )
        }}
        locale={{ itemUnit: 'послуга', itemsUnit: 'послуг' }}
      />
    </div>
  )

  const handleSaveModal = () => {
    const orderedGroups = localServiceGroups.map((g) => ({
      groupName: g.groupName,
      services: (targetKeys[g.groupName] || []).map(String),
    }))
    onSave(orderedGroups)
    onClose()
  }

  const handlePanelChange = (keys: string | string[]) => {
    setActivePanel(keys)
    if (
      keys.length === 0 ||
      (!keys.includes('new-group') && !keys.includes('new-service'))
    ) {
      if (!keys.includes('new-group')) {
        setNewGroupName('')
      }
      if (!keys.includes('new-service')) {
        setNewServiceName('')
      }
    }
  }

  const collapseItems: CollapseProps['items'] = [
    {
      key: 'new-group',
      label: 'Додати групу послуг',
      children: (
        <Card size="small">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Input
              placeholder="Назва групи"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              autoFocus
              style={{ flex: 1 }}
            />
            <Button onClick={handleCancelNewGroup}>Скасувати</Button>
            <Button type="primary" onClick={handleSaveNewGroup}>
              Зберегти групу
            </Button>
          </div>
        </Card>
      ),
    },
    {
      key: 'new-service',
      label: 'Додати послугу',
      children: (
        <Card size="small">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Input
              placeholder="Введіть назву послуги"
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
              autoFocus
              style={{ flex: 1 }}
            />
            <Button onClick={handleCancelNewService}>Скасувати</Button>
            <Button type="primary" onClick={handleSaveNewService}>
              Зберегти послугу
            </Button>
          </div>
        </Card>
      ),
    },
  ]

  return (
    <Modal
      title="Мої послуги"
      open={open}
      onCancel={onClose}
      width={1200}
      footer={
        editable
          ? [
              <Button key="cancel" onClick={onClose}>
                Скасувати
              </Button>,
              <Button key="save" type="primary" onClick={handleSaveModal}>
                Зберегти
              </Button>,
            ]
          : [
              <Button key="close" onClick={onClose}>
                Закрити
              </Button>,
            ]
      }
      style={{
        maxHeight: '80vh',
        overflowY: 'auto',
        paddingRight: '8px',
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {editable && (
          <Collapse
            items={collapseItems}
            activeKey={activePanel}
            onChange={handlePanelChange}
          />
        )}

        <div style={{ maxHeight: 'calc(70vh - 150px)', overflowY: 'auto' }}>
          {localServiceGroups.length > 0
            ? localServiceGroups.map((g) => (
                <Card
                  key={g.groupName}
                  title={
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>Група: {g.groupName}</span>
                      {editable && isGlobalAdmin && (
                        <Button
                          type="text"
                          danger
                          onClick={() => handleRemoveGroup(g.groupName)}
                        >
                          Видалити групу послуг
                        </Button>
                      )}
                    </div>
                  }
                  size="small"
                  style={{ marginBottom: 16 }}
                >
                  {renderTransfer(g.groupName)}
                </Card>
              ))
            : activePanel.length === 0 && (
                <Card title="Загальні послуги" size="small">
                  {renderTransfer('default')}
                </Card>
              )}
        </div>
      </Space>
    </Modal>
  )
}

export default DomainModal