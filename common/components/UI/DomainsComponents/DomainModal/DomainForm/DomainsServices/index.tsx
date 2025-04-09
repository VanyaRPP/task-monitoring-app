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

  const [createCustomService] = useCreateCustomServiceMutation()

  useEffect(() => {
    if (customServices?.data && domainId) {
      const services = customServices.data.map((service) => ({
        _id: service._id,
        name: service.name,
      }))
  
      Promise.resolve().then(() => {
        form.setFieldsValue({ domainServices: services })
        onCustomServicesChange(services)
      })
    }
  }, [customServices, domainId])

  const handleSave = async (fieldKey: number) => {
    const service = form.getFieldValue(['domainServices', fieldKey])
    if (!service.name) {
      message.error('Будь ласка, введіть назву послуги')
      return
    }

    const existingService = customServices?.data.find(
      (s) => s.name === service?.name && s.domainId === domainId
    )
    if (existingService) {
      message.info('Послуга з такою назвою вже існує')
      return
    }

    try {
      const result = await createCustomService({
        name: service?.name,
      }).unwrap()
      const savedService = result.data

      const updatedDomainServices = form
      .getFieldValue('domainServices')
      .map((s, idx) =>
        idx === fieldKey ? { ...s, _id: savedService._id } : s
      )

      form.setFieldsValue({
      domainServices: updatedDomainServices,
      })
      const currentServices: string[] = form.getFieldValue('services') || []
      if (!currentServices.includes(savedService._id)) {
      form.setFieldsValue({
        services: [...currentServices, savedService._id],
      })
      }
      message.success('Послугу успішно збережено')
    } catch (error) {
      message.error('Помилка збереження послуги')
    }
  }

  const handleRemove = (removedService: { _id?: string }) => {
    const currentServiceIds: string[] = form.getFieldValue('services') || []
  
    if (removedService?._id && currentServiceIds.includes(removedService._id)) {
      form.setFieldsValue({
        services: currentServiceIds.filter(id => id !== removedService._id),
      })
    }
  }
  
  

  // if (isLoading) return <div>Завантаження...</div>
  // if (error) {
  //   return <div>Помилка завантаження даних: {JSON.stringify(error)}</div>
  // }

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
                editable ? (
                  <div>
                    <Button type="link" onClick={() => handleSave(field.key)}>
                      <SaveOutlined />
                    </Button>
                    <Button
                      type="link"
                      danger
                      onClick={() => {
                        const removedService = form.getFieldValue('domainServices')[field.name] 
                        remove(field.name) 
                        handleRemove(removedService) 
                      }}
>
                      <CloseOutlined />
                    </Button>
                  </div>
                ) : null
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
