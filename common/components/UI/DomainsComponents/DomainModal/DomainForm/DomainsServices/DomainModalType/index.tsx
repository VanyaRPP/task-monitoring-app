import { Checkbox, Col, Form, Input, Row, Select } from 'antd'
import React, { FC, useMemo } from 'react'

import { ICustomDomainTypeTemplate } from '@common/api/domainApi/domain.api.types'
import {
  buildDomainTypeSelectBaseOptions,
  computeDomainTypeSelectValue,
  mergeDomainTypeSelectOptionsWithCustomValue,
  parseDomainTypeSelectChange,
} from '@utils/domain/domain-modal-type-select'

interface Props {
  onTypeChange: (value: string) => void
  onCustomLabelsBlur?: () => void
  onTemplateApplied?: () => void
  templates?: ICustomDomainTypeTemplate[]
  editable?: boolean
}

const DomainModalType: FC<Props> = ({
  onTypeChange,
  onCustomLabelsBlur,
  onTemplateApplied,
  templates = [],
  editable = true,
}) => {
  const form = Form.useFormInstance()
  const domainType = Form.useWatch('domainType', form)
  const typeLabel = Form.useWatch('customDomainTypeLabel', form)
  const groupName = Form.useWatch('customServiceGroupName', form)

  const selectValue = useMemo(
    () =>
      computeDomainTypeSelectValue(domainType, typeLabel, groupName, templates),
    [domainType, typeLabel, groupName, templates]
  )

  const baseOptions = useMemo(
    () => buildDomainTypeSelectBaseOptions(templates),
    [templates]
  )

  const selectOptions = useMemo(
    () =>
      mergeDomainTypeSelectOptionsWithCustomValue(baseOptions, selectValue),
    [baseOptions, selectValue]
  )

  const handleServiceTypeChange = (v: string) => {
    const parsed = parseDomainTypeSelectChange(v, templates)
    if (!parsed) return

    switch (parsed.kind) {
      case 'communal':
      case 'it':
        form.setFieldsValue({ domainType: parsed.kind })
        onTypeChange(parsed.kind)
        return
      case 'own_manual_empty':
        form.setFieldsValue({
          domainType: 'own',
          customDomainTypeLabel: '',
          customServiceGroupName: '',
        })
        onTypeChange('own')
        return
      case 'own_from_template':
        form.setFieldsValue({
          domainType: 'own',
          customDomainTypeLabel: parsed.typeLabel,
          customServiceGroupName: parsed.groupName,
        })
        onTypeChange('own')
        onTemplateApplied?.()
        return
      case 'own_from_custom_encoded':
        form.setFieldsValue({
          domainType: 'own',
          customDomainTypeLabel: parsed.typeLabel,
          customServiceGroupName: parsed.groupName,
        })
        onTypeChange('own')
        onTemplateApplied?.()
        return
      default:
        return
    }
  }

  return (
    <>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Form.Item name="domainType" noStyle hidden preserve>
            <input type="hidden" />
          </Form.Item>
          <Form.Item label="Тип послуг" style={{ marginBottom: 0 }}>
            <Select
              placeholder="Оберіть тип"
              value={selectValue}
              onChange={handleServiceTypeChange}
              style={{ width: '100%' }}
              disabled={!editable}
              options={selectOptions}
              optionFilterProp="label"
              showSearch
            />
          </Form.Item>
        </Col>
      </Row>

      {domainType === 'own' && (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="customDomainTypeLabel"
                label="Назва типу"
                dependencies={['domainType']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (getFieldValue('domainType') !== 'own') {
                        return Promise.resolve()
                      }
                      if (!value?.trim()) {
                        return Promise.reject(
                          new Error('Введіть назву типу')
                        )
                      }
                      return Promise.resolve()
                    },
                  }),
                ]}
                preserve={true}
                style={{ marginBottom: 0 }}
              >
                <Input
                  placeholder="Напр. Охорона, Оренда приміщень"
                  disabled={!editable}
                  onBlur={() => onCustomLabelsBlur?.()}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="customServiceGroupName"
                label="Назва групи послуг"
                dependencies={['domainType']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (getFieldValue('domainType') !== 'own') {
                        return Promise.resolve()
                      }
                      if (!value?.trim()) {
                        return Promise.reject(
                          new Error('Введіть назву групи')
                        )
                      }
                      return Promise.resolve()
                    },
                  }),
                ]}
                preserve={true}
                style={{ marginBottom: 0 }}
              >
                <Input
                  placeholder="Група в каталозі «Мої послуги»"
                  disabled={!editable}
                  onBlur={() => onCustomLabelsBlur?.()}
                />
              </Form.Item>
            </Col>
          </Row>

          {editable && (
            <Row style={{ marginBottom: 16 }}>
              <Col span={24}>
                <Form.Item
                  name="publishCustomTypeTemplate"
                  valuePropName="checked"
                  preserve={false}
                  style={{ marginBottom: 0 }}
                >
                  <Checkbox>
                    Зробити цей тип і групу доступними іншим адмінам як шаблон
                  </Checkbox>
                </Form.Item>
              </Col>
            </Row>
          )}
        </>
      )}
    </>
  )
}

export default DomainModalType
