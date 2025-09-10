import {
  useGetCustomServicesQuery,
  useCreateCustomServiceMutation,
  useDeleteCustomServiceMutation,
} from '@common/api/customServicesApi/customServices.api'
import {
  DeleteOutlined,
} from '@ant-design/icons'
import {
  Button,
  Form,
  FormInstance,
  Input,
  message,
  Popconfirm,
  Space,
  Select,
} from 'antd'
import React, { FC, useState, useMemo } from 'react'

interface Props {
  form: FormInstance
  editable: boolean
  domainId?: string
  onCustomServicesChange?: (
    customServices: { _id: string; name: string }[]
  ) => void
}

const DomainsServices: FC<Props> = ({ form, editable, domainId }) => {
  const [createCustomService] = useCreateCustomServiceMutation()
  const [deleteCustomService, { isLoading: isDeleting }] = useDeleteCustomServiceMutation()

  const {
    data: allServices,
    isLoading: servicesLoading,
  } = useGetCustomServicesQuery({})

  const [customName, setCustomName] = useState('')
  const [isPopOpen, setIsPopOpen] = useState(false)
  const [isDeletePopOpen, setIsDeletePopOpen] = useState(false)
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  
  const [isDeleteHovered, setIsDeleteHovered] = useState(false);

  const handleAddCustomService = async () => {
    if (!customName) {
      message.warning('Введіть назву послуги')
      return
    }

    try {
      await createCustomService({ name: customName }).unwrap()
      message.success('Кастомна послуга додана')
      setCustomName('')
      setIsPopOpen(false)
    } catch (err: any) {
      const isConflict =
        err?.status === 409 || err?.data?.message?.toLowerCase().includes('вже існує')
      if (isConflict) {
        message.warning('Послуга з такою назвою вже існує')
      } else {
        message.error('Помилка при додаванні послуги')
      }
    }
  }

	const handleDeleteGlobalService = async () => {
		if (!selectedServiceId) {
			message.error('Будь ласка, оберіть послугу для видалення')
			return
		}

		try {
			await deleteCustomService(selectedServiceId).unwrap()

			const currentValues = form.getFieldsValue()
			if (currentValues?.customServices) {
				const updatedCustomServices = currentValues.customServices.map(
					(group: any) => ({
						...group,
						services: group.services.filter(
							(s: string) => s !== selectedServiceId
						),
					})
				)
				form.setFieldsValue({ customServices: updatedCustomServices })
			}

			message.success('Послугу успішно видалено')
			setSelectedServiceId(null)
			setIsDeletePopOpen(false)
		} catch (err: any) {
			// eslint-disable-next-line no-console
			console.error("❌ Delete error:", err)

			if (err?.data?.message) {
				message.error(`Помилка: ${err.data.message}`)
			} else if (err?.error) {
				message.error(`Помилка: ${err.error}`)
			} else {
				message.error('Невідома помилка при видаленні')
			}
		}
	}

  const serviceOptions = useMemo(() => {
    return allServices?.data?.map((service) => ({
      value: service._id,
      label: service.name,
    }))
  }, [allServices])

  const deleteButtonStyle = {
    color: isDeleteHovered ? '#ff4d4f' : 'rgba(255, 255, 255, 0.88)',
    borderColor: isDeleteHovered ? '#ff4d4f' : 'rgba(255, 255, 255, 0.25)',
  };
  
  return (
    <>
      {editable && (
        <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
          <Popconfirm
            title={
              <Space direction="vertical" style={{ display: 'flex' }}>
                <Input
                  placeholder="Введіть вашу послугу"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  autoFocus
                />
                <Button type="primary" onClick={handleAddCustomService}>
                  Підтвердити
                </Button>
              </Space>
            }
            open={isPopOpen}
            onOpenChange={setIsPopOpen}
            icon={null}
            okButtonProps={{ style: { display: 'none' } }}
            cancelButtonProps={{ style: { display: 'none' } }}
          >
            <Button type="dashed" style={{ width: '100%', marginBottom: 16 }}>
              + Додати послугу
            </Button>
          </Popconfirm>
          
          <Popconfirm
            title={
              <Space direction="vertical" style={{ display: 'flex', minWidth: 300 }}>
                <Select
                  placeholder="Оберіть послугу для видалення"
                  onChange={(value) => setSelectedServiceId(value)}
                  options={serviceOptions}
                  style={{ width: '100%' }}
                  loading={servicesLoading}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
                <Button
                  type="primary"
                  danger
                  onClick={handleDeleteGlobalService}
                  loading={isDeleting}
                >
                  Підтвердити видалення
                </Button>
              </Space>
            }
            open={isDeletePopOpen}
            onOpenChange={setIsDeletePopOpen}
            icon={null}
            okButtonProps={{ style: { display: 'none' } }}
            cancelButtonProps={{ style: { display: 'none' } }}
          >
            <Button 
                type="dashed"
                style={{ ...deleteButtonStyle, width: '100%' }}
                icon={<DeleteOutlined />}
                onMouseEnter={() => setIsDeleteHovered(true)}
                onMouseLeave={() => setIsDeleteHovered(false)}
            >
              Видалити послугу
            </Button>
          </Popconfirm>
        </Space>
      )}
    </>
  )
}

export default DomainsServices