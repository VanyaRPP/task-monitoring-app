import { Button, Card, Form, Input, Select, Space } from 'antd'
import { validateField } from '@assets/features/validators'
import React, { FC, useEffect } from 'react'
import s from '../style.module.scss'
import { CloseOutlined } from '@ant-design/icons'
import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import { useForm } from 'antd/lib/form/Form'

interface Props {
  editable: boolean
  form: any
}

const DomainInfo: FC<Props> = ({ editable, form }) => {
  // Watch the values of specific fields
  const IE_NAME = Form.useWatch('IEName', form)
  const IBAN = Form.useWatch('iban', form)
  const RNOKPP = Form.useWatch('rnokpp', form)
  const MFO = Form.useWatch('mfo', form)

  useEffect(() => {
    // Initialize an array to hold the description lines
    const descriptionLines = []

    // Conditionally add lines to the description based on field values
    if (IE_NAME) descriptionLines.push(`${IE_NAME}`)
    if (IBAN) descriptionLines.push(`IBAN: ${IBAN}`)
    if (RNOKPP) descriptionLines.push(`РНОКПП: ${RNOKPP}`)
    if (MFO) descriptionLines.push(`МФО: ${MFO}`)

    // Update the description field in the form
    if (editable) {
      form.setFieldsValue({
        description: descriptionLines.join('\n'), // Join lines with a newline character
      })
    }
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
      <Form.Item name="IEName" label="FOP" rules={validateField('required')}>
        <Space.Compact className={s.formInput}>
          <Input
            placeholder="Вкажіть ФОП"
            maxLength={256}
            className={s.formInput}
            disabled={!editable}
          />
        </Space.Compact>
      </Form.Item>
      {/* IBAN */}
      <Form.Item name="iban" label="IBAN" rules={validateField('IBAN')}>
        <Input
          placeholder="Вкажіть IBAN"
          maxLength={34}
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>
      <Form.Item name="rnokpp" label="РНОКПП" rules={validateField('required')}>
        <Input
          placeholder="Вкажіть РНОКПП"
          maxLength={256}
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>
      <Form.Item name="mfo" label="МФО" rules={validateField('required')}>
        <Input
          placeholder="Вкажіть МФО"
          maxLength={256}
          className={s.formInput}
          disabled={!editable}
        />
      </Form.Item>
      <Form.Item name="description" label="Опис">
        <Input.TextArea
          placeholder="Вкажіть значення"
          className={s.formInput}
          maxLength={512}
          rows={4}
          disabled={!editable}
        />
      </Form.Item>

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

                <Form.Item label="Token" name={[field.name, 'token']}>
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
