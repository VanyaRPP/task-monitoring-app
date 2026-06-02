'use client'

import { useMemo, useState } from 'react'
import type React from 'react'
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from 'antd'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import {
  useDeleteCustomServiceMutation,
  useEditCustomServiceMutation,
  useGetCustomServicesQuery,
} from '@common/api/customServicesApi/customServices.api'
import type { ICustomService } from '@common/api/customServicesApi/customServices.api.types'
import {
  useGetDomainsByAdminQuery,
  useGetDomainsQuery,
  useGetDomainTypeTemplatesQuery,
} from '@common/api/domainApi/domain.api'
import type { DomainTypeTemplateCategory } from '@common/api/domainApi/domain.api.types'
import { defaultServices, Roles, ServiceType } from '@utils/constants'
import {
  getVisibleServices,
  type IDomainForVisibility,
} from '@utils/servicesVisibility'
import {
  getDomainTypeTemplateCategoryLabel,
  DOMAIN_TYPE_TEMPLATE_CATEGORY_OPTIONS,
} from '@utils/domain/domain-type-template-categories'

export const CustomServicesTable: React.FC = () => {
  const { data: user } = useGetCurrentUserQuery()
  const isGlobalAdmin = user?.roles?.includes(Roles.GLOBAL_ADMIN)
  const isDomainAdmin = user?.roles?.includes(Roles.DOMAIN_ADMIN)

  const { data: customServicesResponse, isLoading } = useGetCustomServicesQuery({})
  const allServices = useMemo(
    () => customServicesResponse?.data ?? [],
    [customServicesResponse?.data]
  )

  const { data: adminDomains = [] } = useGetDomainsByAdminQuery(undefined, {
    skip: !isDomainAdmin || isGlobalAdmin,
  })
  const { data: allDomains = [] } = useGetDomainsQuery(
    {},
    { skip: !isGlobalAdmin }
  )

  const domains = useMemo(
    () => (isGlobalAdmin ? allDomains : adminDomains),
    [isGlobalAdmin, allDomains, adminDomains]
  )

  const { data: templates = [] } = useGetDomainTypeTemplatesQuery()

  const templateCategoryMap = useMemo(() => {
    const map = new Map<string, DomainTypeTemplateCategory>()
    templates.forEach((t) => map.set(String(t._id), t.category))
    return map
  }, [templates])

  const serviceIdToCategoryMap = useMemo(() => {
    const map = new Map<string, DomainTypeTemplateCategory>()
    templates.forEach((t) => {
      t.groups?.forEach((g) => {
        g.serviceIds?.forEach((sid) => {
          map.set(String(sid), t.category)
        })
      })
    })
    return map
  }, [templates])

  const domainCategoryMap = useMemo(() => {
    const map = new Map<string, DomainTypeTemplateCategory>()
    domains.forEach((d: any) => {
      if (!d._id) return
      const templateId = String(d.domainTypeTemplateId ?? '')
      const cat = templateCategoryMap.get(templateId)
      if (cat) map.set(String(d._id), cat)
    })
    return map
  }, [domains, templateCategoryMap])

  const visibleServices = useMemo<ICustomService[]>(() => {
    const visible = getVisibleServices(
      user?.roles,
      adminDomains as IDomainForVisibility[],
      allServices
    )
    const visibleIds = new Set(visible.map((s) => s._id))
    return allServices.filter((s) => visibleIds.has(s._id))
  }, [user?.roles, adminDomains, allServices])

  const defaultServiceIds = useMemo(() => new Set(defaultServices), [])

  const resolveCategory = (s: ICustomService): DomainTypeTemplateCategory | string | undefined =>
    s.category
    ?? serviceIdToCategoryMap.get(String(s._id))
    ?? (s.domain ? domainCategoryMap.get(s.domain) : undefined)
    ?? (defaultServiceIds.has(s._id) ? ('utility' as DomainTypeTemplateCategory) : undefined)
    ?? s.groupName

  const [search, setSearch] = useState('')
  const [selectedDomain, setSelectedDomain] = useState<string | undefined>(undefined)

  const domainOptions = useMemo(
    () =>
      (allDomains as any[]).map((d) => ({
        value: String(d._id),
        label: d.name,
      })),
    [allDomains]
  )

  const filtered = useMemo(() => {
    let result = visibleServices
    if (selectedDomain) {
      result = result.filter((s) => s.domain === selectedDomain)
    }
    if (!search.trim()) return result
    const q = search.toLowerCase()
    return result.filter((s) => s.name.toLowerCase().includes(q))
  }, [visibleServices, search, selectedDomain])

  const categoryFilters = useMemo(() => {
    return DOMAIN_TYPE_TEMPLATE_CATEGORY_OPTIONS.map((opt) => ({
      text: opt.label,
      value: opt.value,
    }))
  }, [])

  const [deleteService] = useDeleteCustomServiceMutation()
  const [editService, { isLoading: isEditing }] = useEditCustomServiceMutation()
  const [editingService, setEditingService] = useState<ICustomService | null>(null)
  const [form] = Form.useForm<{ name: string }>()

  const openEdit = (record: ICustomService) => {
    setEditingService(record)
    form.setFieldsValue({ name: record.name })
  }

  const handleEdit = async () => {
    try {
      const { name } = await form.validateFields()
      await editService({ _id: editingService._id, name }).unwrap()
      message.success('Послугу оновлено')
      setEditingService(null)
    } catch {
      message.error('Помилка при оновленні послуги')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteService({ id }).unwrap()
      message.success('Послугу видалено')
    } catch {
      message.error('Помилка при видаленні послуги')
    }
  }

  const columns = [
    {
      title: 'Назва послуги',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: ICustomService, b: ICustomService) =>
        a.name.localeCompare(b.name),
    },
    {
      title: 'Категорія',
      key: 'category',
      width: 160,
      filters: categoryFilters,
      onFilter: (value: unknown, record: ICustomService) =>
        resolveCategory(record) === value,
      render: (_: unknown, record: ICustomService) => {
        const cat = resolveCategory(record)
        return (
          <Tag color={cat ? 'blue' : 'default'}>
            {cat
              ? getDomainTypeTemplateCategoryLabel(cat as DomainTypeTemplateCategory)
              : 'Інше'}
          </Tag>
        )
      },
    },
    {
      title: 'Дії',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: ICustomService) => {
        const isStandard =
          record.serviceType && record.serviceType !== ServiceType.Custom
        return (
          <Space>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openEdit(record)}
              disabled={!!isStandard}
            />
            <Popconfirm
              title="Видалити послугу?"
              description="Цю дію неможливо скасувати"
              onConfirm={() => handleDelete(record._id)}
              okText="Так"
              cancelText="Ні"
              disabled={!!isStandard}
            >
              <Button
                type="text"
                icon={<DeleteOutlined />}
                danger
                disabled={!!isStandard}
              />
            </Popconfirm>
          </Space>
        )
      },
    },
  ]

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Пошук послуги..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ width: 320 }}
        />
        {isGlobalAdmin && (
          <Select
            placeholder="Фільтр за доменом"
            allowClear
            style={{ width: 220 }}
            options={domainOptions}
            value={selectedDomain}
            onChange={setSelectedDomain}
            showSearch
            filterOption={(input, opt) =>
              (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
        )}
      </Space>
      <Table
        rowKey="_id"
        dataSource={filtered}
        columns={columns}
        loading={isLoading}
        size="small"
        pagination={{ position: ['bottomCenter'], hideOnSinglePage: true }}
      />

      <Modal
        title="Редагувати послугу"
        open={!!editingService}
        onOk={handleEdit}
        onCancel={() => setEditingService(null)}
        okText="Зберегти"
        cancelText="Скасувати"
        confirmLoading={isEditing}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Назва"
            rules={[{ required: true, message: 'Введіть назву послуги' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
