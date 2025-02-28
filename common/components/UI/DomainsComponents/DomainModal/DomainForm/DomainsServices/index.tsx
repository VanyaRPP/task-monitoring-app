import {
  useGetCustomServicesQuery,
  useCreateCustomServiceMutation,
} from '@common/api/customServicesApi/customServices.api'
import { CloseOutlined, SaveOutlined } from '@ant-design/icons'
import { Button, Card, Form, FormInstance, Input, Tooltip, message } from 'antd'
import React, { FC, useEffect } from 'react'

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
  const {
    data: customServices,
    isLoading,
    error,
  } = useGetCustomServicesQuery({ domainId }, { skip: !domainId })

  const [createCustomService] = useCreateCustomServiceMutation()

  useEffect(() => {
    if (customServices && customServices.data) {
      const services = customServices.data.map((service) => ({
        _id: service._id,
        name: service.name,
      }))
      form.setFieldsValue({ domainServices: services })
      onCustomServicesChange(services)
    }
  }, [customServices, domainId, form, onCustomServicesChange])

  const handleSave = async (fieldKey: number) => {
    const service = form.getFieldValue(['domainServices', fieldKey])
    if (!service.name) {
      message.error('Будь ласка, введіть назву послуги')
      return
    }

    const existingService = customServices?.data.find(
      (s) => s.name === service.name && s.domainId === domainId
    )
    if (existingService) {
      message.info('Послуга з такою назвою вже існує')
      return
    }

    try {
      const result = await createCustomService({
        name: service.name,
        domainId,
      }).unwrap()
      const savedService = result.data
      form.setFieldsValue({
        domainServices: form
          .getFieldValue('domainServices')
          .map((s, idx) =>
            idx === fieldKey ? { ...s, _id: savedService._id } : s
          ),
      })
      message.success('Послугу успішно збережено')
    } catch (error) {
      message.error('Помилка збереження послуги')
    }
  }

  const handleRemove = (fieldName: number) => {
    const updatedServices = form
      .getFieldValue('domainServices')
      .filter((_, idx) => idx !== fieldName)
    form.setFieldsValue({ domainServices: updatedServices })
  }

  if (isLoading) return <div>Завантаження...</div>
  if (error) {
    return <div>Помилка завантаження даних: {JSON.stringify(error)}</div>
  }

  return (
    <Form.List name="domainServices">
      {(fields, { add, remove }) => (
        <div style={{ display: 'flex', rowGap: 16, flexDirection: 'column' }}>
          {fields.map((field) => (
            <Card
              size="small"
              title={`Послуга ${field.name + 1}`}
              key={field.key}
              aria-disabled={!editable}
              extra={
                <div>
                  <Button
                    type="link"
                    onClick={() => handleSave(field.key)}
                    disabled={!editable}
                  >
                    <SaveOutlined />
                  </Button>
                  <Button
                    type="link"
                    danger
                    onClick={() => {
                      remove(field.name)
                      handleRemove(field.name)
                    }}
                    disabled={!editable}
                  >
                    <CloseOutlined />
                  </Button>
                </div>
              }
            >
              <Form.Item label="Найменування" name={[field.name, 'name']}>
                <Input
                  placeholder="Найменування послуги"
                  disabled={!editable}
                />
              </Form.Item>
            </Card>
          ))}
          {editable && (
            <Tooltip title="Якщо послуги зі списку вам не підходять, ви можете створити власну">
              <Button
                type="dashed"
                style={{ marginBottom: 10 }}
                onClick={() => add()}
                block
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
