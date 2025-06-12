import {
  useGetCustomServicesQuery,
  useCreateCustomServiceMutation,
} from '@common/api/customServicesApi/customServices.api'
import { CloseOutlined, SaveOutlined } from '@ant-design/icons'
import {
  Button,
  Card,
  Form,
  FormInstance,
  Input,
  Tooltip,
  message,
  Popconfirm,
  Space,
} from 'antd'
import React, { FC, useState } from 'react'

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

  const [customName, setCustomName] = useState('')
  const [isPopOpen, setIsPopOpen] = useState(false)

  const handleSave = async (fieldKey: number) => {
    const service = form.getFieldValue(['domainServices', fieldKey])
    if (!service?.name) {
      message.error('Будь ласка, введіть назву послуги')
      return
    }

    try {
      const result = await createCustomService({
        name: service?.name,
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

  const handleAddCustomService = async () => {
    if (!customName) {
      message.warning('Введіть назву послуги')
      return
    }

    try {
      const result = await createCustomService({ name: customName }).unwrap()

      const current = form.getFieldValue('domainServices') || []
      form.setFieldsValue({
        domainServices: [
          ...current,
          { name: customName, _id: result.data._id },
        ],
      })

      message.success('Кастомна послуга додана')
      setCustomName('')
      setIsPopOpen(false)
    } catch (err: any) {
      console.error('Помилка створення послуги:', err)

      const isConflict =
        err?.status === 409 ||
        err?.originalStatus === 409 ||
        err?.data?.message?.toLowerCase().includes('вже існує')

      if (isConflict) {
        message.warning('Послуга з такою назвою вже існує')
      } else {
        message.error('Помилка при додаванні послуги')
      }
    }
  }

  return (
    <>
      {editable && (
        <Popconfirm
          title={
            <>
              <Space
                direction="vertical"
                style={{ display: 'flex', minWidth: 300 }}
              >
                <Input
                  placeholder="Введіть вашу послугу"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  autoFocus
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 10,
                    marginTop: 10,
                  }}
                >
                  <Button onClick={() => setIsPopOpen(false)}>Скасувати</Button>
                  <Button type="primary" onClick={handleAddCustomService}>
                    Підтвердити
                  </Button>
                </div>
              </Space>
            </>
          }
          open={isPopOpen}
          onOpenChange={setIsPopOpen}
          icon={null}
          showCancel={false}
          okButtonProps={{ style: { display: 'none' } }}
        >
          <Button type="dashed" style={{ marginBottom: 10 }} block>
            + Додати послугу
          </Button>
        </Popconfirm>
      )}
    </>
  )
}

export default DomainsServices
