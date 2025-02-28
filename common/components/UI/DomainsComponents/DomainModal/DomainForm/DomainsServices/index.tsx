import { CloseOutlined, SaveOutlined } from '@ant-design/icons'
import { Button, Card, Form, FormInstance, Input, Tooltip, message } from 'antd'
import React, { FC, useState, useEffect } from 'react'

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
  const [saving, setSaving] = useState<{ [key: number]: boolean }>({})
  const [customServices, setCustomServices] = useState<
    { _id: string; name: string }[]
  >([])

  useEffect(() => {
    const fetchCustomServices = async () => {
      try {
        const response = await fetch(
          `/api/custom-services?domainId=${domainId}`
        )
        const data = await response.json()
        if (data.success) {
          setCustomServices(data.data)
          form.setFieldsValue({ domainServices: data.data })
        } else {
          message.error('Помилка завантаження кастомних послуг')
        }
      } catch (error) {
        message.error('Помилка отримання кастомних послуг')
      }
    }
    if (domainId) {
      fetchCustomServices()
    }
  }, [domainId, form])

  const handleSave = async (fieldKey: number) => {
    const service = form.getFieldValue(['domainServices', fieldKey])
    if (!service.name) {
      message.error('Будь ласка, введіть назву послуги')
      return
    }

    setSaving((prev) => ({ ...prev, [fieldKey]: true }))
    try {
      const response = await fetch('/api/custom-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: service.name, domainId }),
      })
      const data = await response.json()
      if (data.success) {
        const savedService = data.data
        form.setFieldsValue({
          domainServices: form
            .getFieldValue('domainServices')
            .map((s, idx) =>
              idx === fieldKey ? { ...s, _id: savedService._id } : s
            ),
        })
        const updatedServices = [...customServices, savedService]
        setCustomServices(updatedServices)
        onCustomServicesChange(updatedServices)
        message.success('Послугу успішно збережено')
      } else {
        message.error('Не вдалося зберегти послугу')
      }
    } catch (error) {
      message.error('Помилка збереження послуги')
    } finally {
      setSaving((prev) => ({ ...prev, [fieldKey]: false }))
    }
  }

  const handleRemove = async (fieldKey: number) => {
    const service = form.getFieldValue(['domainServices', fieldKey])
    if (service._id) {
      try {
        const response = await fetch(`/api/custom-services/${service._id}`, {
          method: 'DELETE',
        })
        const data = await response.json()
        if (data.success) {
          message.success('Послугу успішно видалено')
        } else {
          message.error('Не вдалося видалити послугу')
        }
      } catch (error) {
        message.error('Помилка видалення послуги')
      }
    }
    const updatedFormServices = form
      .getFieldValue('domainServices')
      .filter((_, idx) => idx !== fieldKey)
    form.setFieldsValue({ domainServices: updatedFormServices })
    const updatedServices = customServices.filter((s) => s._id !== service._id)
    setCustomServices(updatedServices)
    onCustomServicesChange(updatedServices)
  }

  return (
    <>
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
                      loading={saving[field.key]}
                      onClick={() => handleSave(field.key)}
                      disabled={!editable}
                    >
                      <SaveOutlined />
                    </Button>
                    <Button
                      type="link"
                      danger
                      onClick={() => handleRemove(field.key)}
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
    </>
  )
}

export default DomainsServices
