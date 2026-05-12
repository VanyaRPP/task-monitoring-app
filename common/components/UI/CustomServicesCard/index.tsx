import React, { useMemo } from 'react'
import { InputNumber, Space, Button, Form, Checkbox, Tooltip } from 'antd'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { inputNumberParser } from '@utils/helpers'
import { CloseOutlined } from '@ant-design/icons'
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

  const selectedIds = customServices.map((s: any) => String(s._id))
  const allIds = allCustomServices.map((service) => String(service._id))
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id))
  const allIndeterminate =
    selectedIds.length > 0 && selectedIds.length < allIds.length

  const handleToggleServices = (checkedIds: string[]) => {
    const selectedServices = allCustomServices
      .filter((service) => checkedIds.includes(String(service._id)))
      .map((service) => {
        const existing = customServices.find(
          (item: any) => String(item._id) === String(service._id)
        )
        return existing
          ? {
              ...existing,
              label: service.label || service.name,
              fieldName: service.fieldName || existing.fieldName,
            }
          : {
              _id: service._id,
              label: service.label || service.name || 'Без назви',
              fieldName: service.fieldName,
              price: 0,
            }
      })

    form.setFieldsValue({ customServices: selectedServices })
  }

  const handleToggleAll = (checked: boolean) => {
    if (!checked) {
      form.setFieldsValue({ customServices: [] })
      return
    }

    const selectedServices = allCustomServices.map((service) => {
      const existing = customServices.find(
        (item: any) => String(item._id) === String(service._id)
      )
      return existing
        ? {
            ...existing,
            label: service.label || service.name,
            fieldName: service.fieldName || existing.fieldName,
          }
        : {
            _id: service._id,
            label: service.label || service.name || 'Без назви',
            fieldName: service.fieldName,
            price: 0,
          }
    })

    form.setFieldsValue({ customServices: selectedServices })
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
          title={allCustomServices.length === 0 ? 'У обраного домена відсутні послуги' : ''}
          placement="top"
        >
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 10, fontWeight: 600, fontSize: 14 }}>
              Індивідуальні послуги
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
                gap: 10,
              }}
            >
              <Checkbox
                checked={allSelected}
                indeterminate={allIndeterminate}
                onChange={(event) => handleToggleAll(event.target.checked)}
                aria-label="Додати усі"
              >
                Додати усі
              </Checkbox>
            </div>
            <Checkbox.Group
              options={allCustomServices.map((service) => ({
                label: service.label || service.name || 'Без назви',
                value: String(service._id),
                disabled: disabled,
              }))}
              value={selectedIds}
              onChange={handleToggleServices}
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            />
          </div>
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
