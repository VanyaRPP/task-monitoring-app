import React, { useMemo, useRef, useState } from 'react'
import { InputNumber, Space, Button, Form, Select, Tooltip } from 'antd'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'
import { inputNumberParser } from '@utils/helpers'
import { CloseOutlined, CheckOutlined } from '@ant-design/icons'
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
  const selectedIds: string[] = customServices.map((s: any) => s._id)

  const [lastClickedId, setLastClickedId] = useState<string | null>(null)
  const shiftPressedRef = useRef(false)

  const buildEntry = (service: any) => ({
    _id: service?._id,
    label: service?.label,
    fieldName: service?.fieldName,
    price: 0,
  })

  const applyIds = (ids: string[]) => {
    const uniqueIds = Array.from(new Set(ids))
    const next = uniqueIds.map((id) => {
      const existing = customServices.find((s: any) => s._id === id)
      if (existing) return existing
      const source = allCustomServices.find((s) => s?._id === id)
      return buildEntry(source)
    })
    form.setFieldsValue({ customServices: next })
  }

  const handleSelectChange = (ids: string[]) => {
    if (shiftPressedRef.current && lastClickedId) {
      const added = ids.find((id) => !selectedIds.includes(id))
      if (added) {
        const fromIdx = allCustomServices.findIndex(
          (s) => s?._id === lastClickedId
        )
        const toIdx = allCustomServices.findIndex((s) => s?._id === added)
        if (fromIdx !== -1 && toIdx !== -1) {
          const [start, end] = [
            Math.min(fromIdx, toIdx),
            Math.max(fromIdx, toIdx),
          ]
          const rangeIds = allCustomServices
            .slice(start, end + 1)
            .map((s) => s?._id)
          applyIds([...selectedIds, ...rangeIds])
          setLastClickedId(added)
          return
        }
      }
    }

    const added = ids.find((id) => !selectedIds.includes(id))
    if (added) setLastClickedId(added)
    applyIds(ids)
  }

  const allSelected =
    allCustomServices.length > 0 &&
    selectedIds.length === allCustomServices.length

  const handleToggleAll = () => {
    if (allSelected) {
      applyIds([])
      setLastClickedId(null)
    } else {
      applyIds(allCustomServices.map((s) => s?._id))
    }
  }

  const selectOptions = allCustomServices.map((s) => ({
    value: s?._id,
    label: s?.label,
  }))

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
          <Select
            mode="multiple"
            placeholder="Індивідуальні послуги"
            value={selectedIds}
            onChange={handleSelectChange}
            options={selectOptions}
            disabled={allCustomServices.length === 0}
            style={{ width: '100%', marginBottom: 16 }}
            maxTagCount="responsive"
            optionFilterProp="label"
            onKeyDown={(e) => {
              shiftPressedRef.current = e.shiftKey
            }}
            onKeyUp={(e) => {
              shiftPressedRef.current = e.shiftKey
            }}
            onMouseDown={(e) => {
              shiftPressedRef.current = e.shiftKey
            }}
            popupRender={(menu) => (
              <>
                <Button
                  type="text"
                  block
                  icon={allSelected ? <CheckOutlined /> : null}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleToggleAll}
                >
                  {allSelected ? 'Скасувати вибір' : 'Обрати всі'}
                </Button>
                {menu}
              </>
            )}
          />
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
