import React from "react"
import { Card, InputNumber } from "antd"
import { Form, FormInstance, Input, Select, Space } from "antd"
import { inputNumberParser } from '@utils/helpers'

type CustomServicesCardProps = {
  form: FormInstance<any>
  customServices?: { 
    _id: string
    name: string
    groupName: string
    services: string[]
  }[]
}

const CustomServicesCard: React.FC<CustomServicesCardProps> = (
  { 
    form,
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
          {(fields) => (
            <>
              {fields.map((field, index) => {
                const group = form.getFieldValue('customServices')?.[index] || {}
                return (
                  <Card
                    key={field.key}
                    title={group.groupName || `Невідома група №${index + 1}`}
                    style={{ marginBottom: 16 }}
                  >
                    <Form.List name={[field.name, 'services']}>
                      {(serviceFields) => (
                        <>
                          {serviceFields.map((serviceField) => {
                            const service =
                              group?.services?.[serviceField.name] || {}
                            return (
                              <Form.Item
                                key={serviceField.key}
                                name={[serviceField.name, 'value']}
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
                                  style={{ width: '100%' }}
                                />
                              </Form.Item>
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