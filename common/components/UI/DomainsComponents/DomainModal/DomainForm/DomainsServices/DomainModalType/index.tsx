import { Button, Col, Form, Row, Select, Space } from 'antd'
import React, { FC, useEffect, useMemo, useState } from 'react'

import { IDomainTypeTemplate } from '@common/api/domainApi/domain.api.types'
import CreateTemplateModal from './CreateTemplateModal'
import { DOMAIN_TYPE_TEMPLATE_CATEGORY_OPTIONS } from '@utils/domain/domain-type-template-categories'

interface Props {
  templates: IDomainTypeTemplate[]
  editable?: boolean
  onTemplateChange: (templateId: string | null) => void
}

const DomainModalType: FC<Props> = ({
  templates,
  editable = true,
  onTemplateChange,
}) => {
  const form = Form.useFormInstance()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const currentTemplateId = Form.useWatch('domainTypeTemplateId', form)
  const currentTemplate = useMemo(
    () => templates.find((t) => t._id === currentTemplateId),
    [templates, currentTemplateId]
  )

  useEffect(() => {
    if (currentTemplate?.category) {
      setSelectedCategory(currentTemplate.category)
    }
  }, [currentTemplate])

  const filteredOptions = useMemo(() => {
    const filtered = selectedCategory
      ? templates.filter((t) => t.category === selectedCategory)
      : templates

    return filtered.map((t) => ({
      value: t._id,
      label: t.isBuiltIn ? t.name : `${t.name} (адмін)`,
    }))
  }, [templates, selectedCategory])

  const handleTemplateChange = (value: string | null) => {
    const template = templates.find((t) => t._id === value)

    setSelectedCategory(template?.category ?? null)
    onTemplateChange(value ?? null)
  }

  const handleCategoryChange = (value: string | null) => {
    setSelectedCategory(value)
    form.setFieldsValue({ domainTypeTemplateId: null })
    onTemplateChange(null)
  }

  return (
    <>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12}>
          <Form.Item
            name="domainTypeTemplateId"
            label="Тип послуг (шаблон)"
            style={{ marginBottom: 0 }}
          >
            <Select
              placeholder="Оберіть шаблон"
              onChange={handleTemplateChange}
              style={{ width: '100%' }}
              options={filteredOptions}
              optionFilterProp="label"
              showSearch
              allowClear
              disabled={!filteredOptions.length && !!selectedCategory}
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item label="Категорія" style={{ marginBottom: 0 }}>
            <Select
              placeholder="Оберіть категорію"
              value={selectedCategory}
              onChange={handleCategoryChange}
              style={{ width: '100%' }}
              options={DOMAIN_TYPE_TEMPLATE_CATEGORY_OPTIONS}
              allowClear
            />
          </Form.Item>
        </Col>
      </Row>

      {editable && (
        <Row style={{ marginBottom: 16 }}>
          <Col span={24}>
            <Space>
              <Button onClick={() => setIsCreateOpen(true)}>
                + Створити новий шаблон
              </Button>
            </Space>
          </Col>
        </Row>
      )}

      <CreateTemplateModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(created) => {
          form.setFieldsValue({ domainTypeTemplateId: created._id })
          setSelectedCategory(created.category)
          onTemplateChange(created._id)
          setIsCreateOpen(false)
        }}
      />
    </>
  )
}

export default DomainModalType
