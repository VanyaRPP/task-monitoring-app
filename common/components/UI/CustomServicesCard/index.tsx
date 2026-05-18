import React, { useMemo } from 'react'
import { InputNumber, Space, Button, Form, Dropdown, Menu, Tooltip } from 'antd'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { inputNumberParser } from '@utils/helpers'
import { CloseOutlined, PlusOutlined } from '@ant-design/icons'
import { Roles } from '@utils/constants'

type CustomServicesCardProps = {
  form: any
  disabled?: boolean
  allCustomServices?: any[]
  isServiceForm?: boolean
}

const CustomServicesCard: React.FC<CustomServicesCardProps> = ({
  form,
  disabled = false,
  allCustomServices = [],
  isServiceForm = false,
}) => {
  const { data: user } = useGetCurrentUserQuery()
  const isDomainAdmin = useMemo(
    () => user?.roles?.includes(Roles.DOMAIN_ADMIN),
    [user]
  )
  const isGlobalAdmin = useMemo(
    () => user?.roles?.includes(Roles.GLOBAL_ADMIN),
    [user]
  )

  const customServices = Form.useWatch('customServices', form) || []

  const selectedIds = customServices.map((s: any) => s._id)
  const dropdownOptions = allCustomServices.filter(
    (service) => !selectedIds.includes(service?._id)
  )

  const handleAddService = (service) => {
    if (customServices.find((s: any) => s._id === service.value)) return
    const newEntry = {
      _id: service?._id,
      label: service?.label,
      fieldName: service?.fieldName,
      price: 0,
    }
    form.setFieldsValue({ customServices: [...customServices, newEntry] })
  }

  const handleRemoveService = (index: number) => {
    const updated = [...customServices]
    updated.splice(index, 1)
    form.setFieldsValue({ customServices: updated })
  }
  const dashIfEmpty = (v: any) => (v === 0 || v ? v : '-')
  return (
    <div>
      {!disabled && !isServiceForm && (
        <Tooltip
          title={
            dropdownOptions.length === 0
              ? 'У обраного домена відсутні послуги'
              : ''
          }
          placement="top"
        >
          <Dropdown
            menu={{
              items: dropdownOptions.map((option) => ({
                key: option.value,
                label: option.label,
                onClick: () => handleAddService(option),
              })),
            }}
            trigger={['click']}
          >
            <Button
              style={{ width: '100%', height: 40, marginBottom: 16 }}
              type="dashed"
              icon={<PlusOutlined />}
            >
              Індивідуальні послуги
            </Button>
          </Dropdown>
        </Tooltip>
      )}

      <Form.List name="customServices">
        {(fields) => (
          <>
            {fields.map((field, index) => {
              const service = customServices[index]
              return (
                <Space
                  key={field.key}
                  style={{
                    width: '100%',
                    display: 'grid',
                    gridTemplateColumns: disabled ? '1fr' : '1fr auto',
                    columnGap: 8,
                    marginBottom: 6,
                    marginTop: 6,
                  }}
                  align="start"
                >
                  <Form.Item
                    name={[field.name, 'price']}
                    label={service?.label}
                    rules={[{ required: true, message: 'Введіть значення' }]}
                    style={{ width: '100%' }}
                    getValueProps={(v) =>
                      disabled ? { value: dashIfEmpty(v) } : { value: v }
                    }
                  >
                    <InputNumber
                      parser={inputNumberParser}
                      placeholder="Введіть значення"
                      style={{
                        width: disabled ? '100%' : !isServiceForm ? 440 : 470,
                      }}
                      disabled={disabled}
                    />
                  </Form.Item>
                  {!disabled &&
                    (isDomainAdmin || isGlobalAdmin) &&
                    !isServiceForm && (
                      <Button
                        type="text"
                        icon={<CloseOutlined />}
                        aria-label={`remove-${service?.label}`}
                        data-testid={`remove-${service?.label}`}
                        onClick={() => handleRemoveService(index)}
                        style={{ marginTop: 6 }}
                      />
                    )}
                </Space>
              )
            })}
          </>
        )}
      </Form.List>
    </div>
  )
}

export default CustomServicesCard
