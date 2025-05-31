import {
  useGetCustomServicesQuery,
  useCreateCustomServiceMutation,
} from '@common/api/customServicesApi/customServices.api'
import { CloseOutlined, SaveOutlined } from '@ant-design/icons'
import { Button, Card, Form, FormInstance, Input, Tooltip, message } from 'antd'
import React, { FC, useEffect } from 'react'
import { useWatch } from 'antd/es/form/Form'

interface Props {
  form: FormInstance
  editable: boolean
  domainId?: string
  onCustomServicesChange: (
    customServices: { _id: string; name: string }[]
  ) => void
}

const DomainsServices: FC<Props> = ({
  form,
  editable,
  domainId,
  onCustomServicesChange,
}) => {
  const [createCustomService] = useCreateCustomServiceMutation()

  const allServices: { name?: string; _id?: string }[] =
    Form.useWatch('domainServices', form) || []
  const handleSave = async (fieldName: number) => {
    const service = form.getFieldValue(['domainServices', fieldName])

    if (!service?.name) {
      message.error('Будь ласка, введіть назву послуги')
      return
    }

    try {
      const result = await createCustomService({
        name: service?.name,
      }).unwrap()

      const savedService = result.data
      const updatedList = form
        .getFieldValue('domainServices')
        .map((s: any, idx: number) =>
          idx === fieldName ? { ...s, _id: savedService._id } : s
        )

      form.setFieldsValue({
        domainServices: updatedList,
      })

      message.success('Послугу успішно збережено')
    } catch (error) {
      message.error('Помилка збереження послуги')
    }
  }

  return (
    <Form.List name="domainServices">
      {(fields, { add, remove }) => (
        <div style={{ display: 'flex', flexDirection: 'column', rowGap: 16 }}>
          {fields.map((field) => {
            const watchedName = allServices[field.name]?.name || ''

            return (
              <Card
                size="small"
                title={`Послуга: ${watchedName || '(без назви)'}`}
                key={field.key}
                aria-disabled={!editable}
                extra={
                  editable && (
                    <div>
                      <Button
                        type="link"
                        onClick={() => {
                          handleSave(field.name)
                        }}
                      >
                        <SaveOutlined />
                      </Button>
                      <Button
                        type="link"
                        danger
                        onClick={() => {
                          remove(field.name)
                        }}
                      >
                        <CloseOutlined />
                      </Button>
                    </div>
                  )
                }
              >
                <Form.Item
                  {...field}
                  label="Найменування"
                  name={[field.name, 'name']}
                  rules={[{ required: true, message: 'Вкажіть назву послуги' }]}
                >
                  <Input
                    placeholder="Найменування послуги"
                    disabled={!editable}
                  />
                </Form.Item>
              </Card>
            )
          })}

          {editable && (
            <Tooltip title="Якщо жодна стандартна послуга не підходить, додайте власну">
              <Button
                type="dashed"
                block
                style={{ marginTop: 8 }}
                onClick={() => {
                  add()
                }}
              >
                + Додати послугу
              </Button>
            </Tooltip>
          )}
        </div>
      )}
    </Form.List>
  )
}

export default DomainsServices
