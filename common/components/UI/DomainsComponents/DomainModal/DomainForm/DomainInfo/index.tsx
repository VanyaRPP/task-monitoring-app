import { Button, Card, Form, Input, Select, Space } from 'antd'
import { validateField } from '@assets/features/validators'
import React, { FC, useEffect, useState } from 'react'
import s from '../style.module.scss'
import { CloseOutlined } from '@ant-design/icons'
import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import { useForm } from 'antd/lib/form/Form'
import AreaCalculationCard from './DomainAreaCalc'

interface Props {
  editable: boolean
  form: any
  currentDomainId?: string
  setIsValueChanged: (value: boolean) => void
}

const DomainInfo: FC<Props> = ({ editable, form, currentDomainId, setIsValueChanged }) => {
  // Watch the values of specific fields
  const IE_NAME = Form.useWatch('IEName', form)
  const IBAN = Form.useWatch('iban', form)
  const RNOKPP = Form.useWatch('rnokpp', form)
  const MFO = Form.useWatch('mfo', form)
  
  const domainId = currentDomainId;
  useEffect(() => {
    if (!editable) return

    const currentDescription: string = form.getFieldValue('description') || ''
    const autoLinePatterns = [/^IBAN: /, /^РНОКПП: /, /^МФО: /]
    const autoValues = [IE_NAME, IBAN, RNOKPP, MFO].filter(Boolean)
    const customLines = currentDescription
      .split('\n')
      .filter((line) => {
        if (!line.trim()) return false
        if (autoLinePatterns.some((p) => p.test(line))) return false
        if (autoValues.includes(line.trim())) return false
        return true
      })

    const autoLines = [
      // IE_NAME ? `ФОП: ${IE_NAME}` : '',
      IBAN ? `IBAN: ${IBAN}` : '',
      RNOKPP ? `РНОКПП: ${RNOKPP}` : '',
      MFO ? `МФО: ${MFO}` : '',
    ].filter(Boolean)

    form.setFieldsValue({
      description: [...autoLines, ...customLines].join('\n'),
    })
  }, [IE_NAME, IBAN, RNOKPP, MFO, form, editable])

  const { data, isLoading } = useGetDomainsQuery({})
  const [formInstance] = useForm()
  const confidantPeopleOptions =
    data?.reduce((uniqueAdminEmails, domain) => {
      const newAdminEmails = domain.adminEmails.filter(
        (email) => !uniqueAdminEmails.includes(email)
      )
      return [...uniqueAdminEmails, ...newAdminEmails]
    }, []) || []

  useEffect(() => {
    if (data) {
      const adminEmails = data.reduce((uniqueAdminEmails, domain) => {
        const newAdminEmails = domain.adminEmails.filter(
          (email) => !uniqueAdminEmails.includes(email)
        )
        return [...uniqueAdminEmails, ...newAdminEmails]
      }, [])
      formInstance.setFieldsValue({ adminEmails })
    }
  }, [data])

  return (
    <div>
      {/* <Form.Item name="IEName" label="FOP">
        <Space.Compact className={s.formInput}>
          <Input
            placeholder="Вкажіть ФОП"
            maxLength={256}
            className={s.formInput}
            disabled={!editable}
          />
        </Space.Compact>
      </Form.Item> */}
      {/* IBAN */}
      <Form.Item name="iban" label="IBAN">
        <Input
          placeholder="Вкажіть IBAN"
          maxLength={34}
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>
      <Form.Item name="rnokpp" label="РНОКПП">
        <Input
          placeholder="Вкажіть РНОКПП"
          maxLength={256}
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>
      <Form.Item name="mfo" label="МФО">
        <Input
          placeholder="Вкажіть МФО"
          maxLength={256}
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>
      <Form.Item
        name="description"
        label="Опис"
        rules={validateField('description')}
      >
        <Input.TextArea
          placeholder="Вкажіть значення"
          className={s.formInput}
          maxLength={512}
          rows={4}
          disabled={!editable}
        />
      </Form.Item>

      <AreaCalculationCard 
      domainId={domainId} 
      editable={editable} 
      form={form} 
      setIsValueChanged={setIsValueChanged}
      />

      <Form.List name="domainBankToken">
        {(fields, { add, remove }) => (
          <div style={{ display: 'flex', rowGap: 16, flexDirection: 'column' }}>
            {fields.map((field) => (
              <Card
                size="small"
                title={`Token ${field.name + 1}`}
                key={field.key}
                aria-disabled={!editable}
                extra={
                  editable && (
                    <Button
                      type="link"
                      onClick={() => {
                        remove(field.name)
                      }}
                    >
                      <CloseOutlined />
                    </Button>
                  )
                }
              >
                <Form.Item label="Name" name={[field.name, 'name']}>
                  <Input
                    placeholder="Token name"
                    className={s.formInput}
                    disabled={!editable}
                  />
                </Form.Item>

                <Form.Item label="Token" name={[field.name, 'shortToken']}>
                  <Input
                    placeholder="Token"
                    className={s.formInput}
                    disabled={
                      !editable ||
                      !!form.getFieldValue([
                        'domainBankToken',
                        field.name,
                        'shortToken',
                      ])
                    }
                  />
                </Form.Item>

                <Form.Item
                  label="Confidant people"
                  name={[field.name, 'confidant']}
                  rules={[
                    {
                      required: false,
                    },
                  ]}
                >
                  <Select
                    mode="tags"
                    placeholder="Confidant people"
                    className={s.formInput}
                    disabled={!editable}
                    onSelect={() => {
                      formInstance.setFieldsValue({ adminEmails: [] })
                    }}
                    filterOption={(inputValue, option) => {
                      if (typeof option?.value === 'string') {
                        return option.value
                          .toLowerCase()
                          .includes(inputValue.toLowerCase())
                      }
                      return false
                    }}
                    showSearch
                  >
                    {confidantPeopleOptions?.map((person) => (
                      <Select.Option key={person} value={person}>
                        {person}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Card>
            ))}

            {editable && (
              <Button type="dashed" onClick={() => add()} block>
                + Add Business Private Token
              </Button>
            )}
          </div>
        )}
      </Form.List>
    </div>
  )
}

export default DomainInfo
