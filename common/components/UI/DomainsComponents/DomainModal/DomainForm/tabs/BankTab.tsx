import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import { CloseOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input, Popconfirm, Select, Space } from 'antd'
import { FC, useMemo } from 'react'
import s from '../style.module.scss'
import type { TabProps } from './types'

const BankTab: FC<TabProps> = ({ form, editable }) => {
  const { data: domains } = useGetDomainsQuery({})

  const confidantPeopleOptions = useMemo(
    () =>
      domains?.reduce<string[]>((unique, domain) => {
        const newAdminEmails = (domain.adminEmails ?? []).filter(
          (email) => !unique.includes(email)
        )
        return [...unique, ...newAdminEmails]
      }, []) ?? [],
    [domains]
  )

  return (
    <Form.List name="domainBankToken">
      {(fields, { add, remove }) => (
        <Space direction="vertical" style={{ width: '100%' }}>
          {fields.map((field) => (
            <Card
              size="small"
              title={`Token ${field.name + 1}`}
              key={field.key}
              aria-disabled={!editable}
              extra={
                editable && (
                  <Popconfirm
                    title="Видалити токен?"
                    description="Інтеграція з банком для цього домена перестане працювати."
                    okText="Так, видалити"
                    cancelText="Скасувати"
                    onConfirm={() => remove(field.name)}
                  >
                    <Button type="link">
                      <CloseOutlined />
                    </Button>
                  </Popconfirm>
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
                rules={[{ required: false }]}
              >
                <Select
                  mode="tags"
                  placeholder="Confidant people"
                  className={s.formInput}
                  disabled={!editable}
                  filterOption={(inputValue, option) =>
                    typeof option?.value === 'string'
                      ? option.value
                          .toLowerCase()
                          .includes(inputValue.toLowerCase())
                      : false
                  }
                  showSearch
                >
                  {confidantPeopleOptions.map((person) => (
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
        </Space>
      )}
    </Form.List>
  )
}

export default BankTab
