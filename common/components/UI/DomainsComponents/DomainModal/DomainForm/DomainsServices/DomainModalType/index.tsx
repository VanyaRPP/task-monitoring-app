import { Button, Col, Form, Row, Select, Space } from 'antd'
import React, { FC, useMemo, useState } from 'react'

import { IDomainTypeTemplate } from '@common/api/domainApi/domain.api.types'
import CreateTemplateModal from './CreateTemplateModal'

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

  const options = useMemo(
    () =>
      templates.map((t) => ({
        value: t._id,
        label: t.isBuiltIn ? t.name : `${t.name} (адмін)`,
      })),
    [templates]
  )

  return (
    <>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Form.Item
            name="domainTypeTemplateId"
            label="Тип послуг (шаблон)"
            style={{ marginBottom: 0 }}
          >
            <Select
              placeholder="Оберіть шаблон"
              onChange={(value: string | null) =>
                onTemplateChange(value ?? null)
              }
              style={{ width: '100%' }}
              disabled={!editable}
              options={options}
              optionFilterProp="label"
              showSearch
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
          onTemplateChange(created._id)
          setIsCreateOpen(false)
        }}
      />
    </>
  )
}

export default DomainModalType
