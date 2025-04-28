import React from "react"
import { Card, InputNumber } from "antd"
import { Form, FormInstance, Input, Select, Space } from "antd"
import { inputNumberParser } from '@utils/helpers'
import { DeleteOutlined, CloseOutlined } from "@ant-design/icons"

type CustomServicesCardProps = {
  form: FormInstance<any>
  customServices?: { 
    _id: string
    name: string
    groupName: string
    services: string[]
  }[]
  disabled?: boolean
}

const CustomServicesCard: React.FC<CustomServicesCardProps> = (
  { 
    form,
    disabled = false,
  }) => {

  const customServices = form.getFieldValue('customServices')

  return (
    customServices?.length 
    ? ( 
    <Card 
      title="Групи послуг" 
      bordered={false}
      style={{ marginBottom: 16 }}
      >
        <Form.List name="customServices">
          {(fields, {remove: removeGroup}) => (
            <>
              {fields.map((field, index) => {
                const group = form.getFieldValue('customServices')?.[index] || {}
                return (
                  <Card
                    key={field.key}
                    title={group.groupName || `Невідома група №${index + 1}`}
                    style={{ marginBottom: 16 }}
                    extra={!disabled && <DeleteOutlined onClick={() => removeGroup(field.name)}/>}
                  >
                    <Form.List name={[field.name, 'services']}>
                      {(serviceFields, { remove: removeService }) => (
                        <>
                          {serviceFields.map((serviceField, serviceIndex) => {
                            const services = form.getFieldValue(['customServices', index, 'services']) || []
                            const service = services?.[serviceField.name] || {}

                            return (
                              <Space 
                                style={{ width: '100%' }}
                                size="middle"
                                >
                              <Form.Item
                                key={serviceField.key}
                                name={[serviceField.name, 'price']}
                                label={service.name || 'Послуга'}
                                rules={[
                                  { 
                                    required: true,
                                    message: 'Введіть значення',
                                  },
                                ]}
                              >
                                <InputNumber
                                  parser={inputNumberParser}
                                  placeholder="Введіть значення"
                                  style={{ width: '320px' }}
                                  disabled={disabled}
                                />
                              </Form.Item>
                              {!disabled && (
                                <CloseOutlined
                                  onClick={() => removeService(serviceIndex)}
                                  style={{ marginLeft: 8 }}
                                />
                              )}
                              </Space>
                            )
                          })}
                        </>
                      )}
                    </Form.List>
                  </Card>
                )
              })}
            </>
          )}
        </Form.List>
      </Card>)
      : (
        <Card 
          title="Групи послуг" 
          bordered={false}
          style={{ marginBottom: 16 }}
        >
          <p>Групи послуг не знайдені</p>
        </Card>
      )
  )
}

export default CustomServicesCard;