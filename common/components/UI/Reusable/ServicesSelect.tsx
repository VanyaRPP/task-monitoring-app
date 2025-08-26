import { Form, FormInstance, Select, Button, Input, Space } from 'antd'
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'
import { CSSProperties, useMemo } from 'react'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { useGetCustomServicesQuery } from '@common/api/customServicesApi/customServices.api'
import { group } from 'console'

export interface ServicesSelectProps {
  domainId?: string
  form: FormInstance
  dropdownStyle?: CSSProperties
  onServicesChange?: (services: string[]) => void
  disabled: boolean
  customServices?: { _id: string; name: string }[]
}

const ServicesSelect: React.FC<ServicesSelectProps> = ({
  domainId,
  form,
  dropdownStyle,
  disabled,
  onServicesChange,
}) => {
  const {
    data: servicesData,
    isLoading,
    isError,
  } = useGetAllServicesQuery({ domainId })

  const { data: customServices } = useGetCustomServicesQuery({})

  const servicesList = useMemo(() => {
    if (!servicesData) return []
    return servicesData.data.map((service: any) => ({
      _id: service._id,
      name: service.domain.name || 'Без назви',
    }))
  }, [servicesData])

  const services = useMemo(() => {
    return customServices?.data
      .slice()
      .sort((a, b) => a?.name.localeCompare(b?.name))
  }, [servicesList, customServices])

  const options = useMemo(() => {
    return services?.map((service) => ({
      value: service._id,
      label: service?.name,
    }))
  }, [services])

  const handleChange = (selectedValues: string[]) => {
    form.setFieldsValue({ services: selectedValues })
    onServicesChange?.(selectedValues)
  }

  if (isLoading) return <div>Завантаження послуг...</div>
  if (isError) return <div>Помилка при завантаженні послуг</div>

  return (
    <>
      <div style={{ marginBottom: 8 }}>Групи послуг</div>
      <Form.List name="customServices">
        {(fields, { add, remove }) => (
          <>
            {fields.map((field, index) => {
              const groupObject =
                form.getFieldValue('customServices')?.[index] || {}
              const groupName = groupObject.groupName || ``
              const groupValues = groupObject.services || []

              return (
                // eslint-disable-next-line react/jsx-key
                <Space
                  direction="horizontal"
                  style={{ width: '100%' }}
                  align="center"
                >
                  <Form.Item required style={{ flex: 1, marginRight: 8 }}>
                    <Input
                      style={{ minWidth: '150px' }}
                      value={groupName}
                      disabled={disabled}
                      onChange={(e) => {
                        const current = form.getFieldValue('customServices')
                        const newName = e.target.value
                        current[index] = {
                          groupName: newName,
                          services: groupValues,
                        }
                        form.setFieldsValue({ customServices: current })
                      }}
                      placeholder="Назва групи"
                    />
                  </Form.Item>
                <div style={{ flex: 3, position: 'relative', paddingRight: '32px', marginBottom: '20px' }}>
                  <Form.Item required style={{ flex: 3 }}>
                    <Select
                      disabled={disabled}
                      mode="multiple"
                      options={(() => {
                        const allGroups =
                          form.getFieldValue('customServices') || []
                        const selectedInOthers = allGroups
                          .filter((_, i) => i !== index)
                          .flatMap((group) => group?.services || [])
                        const filteredOptions = options?.map((opt) => ({
                          ...opt,
                          disabled: selectedInOthers.includes(opt?.value),
                        }))
                        return filteredOptions
                      })()}
                      style={{ width: '220px' }}
                      value={groupValues}
                      onChange={(newValues) => {
                        const current = form.getFieldValue('customServices')
                        current[index] = {
                          groupName: groupName,
                          services: newValues,
                        }
                        form.setFieldsValue({ customServices: current })
                      }}
                      placeholder="Оберіть послуги"
                      allowClear
                      showSearch
                    />
                  </Form.Item>
                  {!disabled && (
                    <MinusCircleOutlined
                      style={{
                        position: 'absolute',
                        top: '50%',
                        right: '-5px', 
                        transform: 'translateY(-50%)',
                        cursor: 'pointer',
                        fontSize: '24px',
                      }}
                      onClick={() => remove(field.name)}
                    />
                  )}
                 </div>
                </Space>
              )
            })}

            {!disabled && (
              <Form.Item>
                <Button
                  type="dashed"
                  style={{ width: '100%' }}
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                >
                  Додати групу послуг
                </Button>
              </Form.Item>
            )}
          </>
        )}
      </Form.List>
    </>
  )
}

export default ServicesSelect
