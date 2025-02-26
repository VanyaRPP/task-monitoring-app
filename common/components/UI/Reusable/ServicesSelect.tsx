import { Form, FormInstance, Select } from 'antd'
import { CSSProperties, useMemo } from 'react'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'

export interface ServicesSelectProps {
  domainId?: string
  form: FormInstance
  dropdownStyle?: CSSProperties
  onServicesChange?: (services: string[]) => void
  customServices?: { _id: string; name: string }[]
}

const ServicesSelect: React.FC<ServicesSelectProps> = ({
  domainId,
  form,
  dropdownStyle,
  onServicesChange,
  customServices = [],
}) => {
  const {
    data: servicesData,
    isLoading,
    isError,
  } = useGetAllServicesQuery({ domainId })

  const servicesList = useMemo(() => {
    if (!servicesData) return []
    return servicesData.data.map((service: any) => ({
      _id: service._id,
      name: service.domain.name || 'Без назви',
    }))
  }, [servicesData])

  const services = useMemo(() => {
    return [...servicesList, ...customServices].sort((a, b) =>
      a.name.localeCompare(b.name)
    )
  }, [servicesList, customServices])

  const options = useMemo(() => {
    return services.map((service) => ({
      value: service._id,
      label: service.name,
    }))
  }, [services])

  const handleChange = (selectedValues: string[]) => {
    form.setFieldsValue({ services: selectedValues })
    onServicesChange?.(selectedValues)
  }

  if (isLoading) return <div>Завантаження послуг...</div>
  if (isError) return <div>Помилка при завантаженні послуг</div>

  return (
    <Form.Item
      name="services"
      label="Послуги"
      rules={[{ required: true, message: 'Оберіть хоча б одну послугу' }]}
    >
      <Select
        mode="multiple"
        options={options}
        placeholder="Оберіть послуги"
        optionFilterProp="label"
        dropdownStyle={dropdownStyle}
        allowClear
        showSearch
        value={form.getFieldValue('services') || []}
        onChange={handleChange}
      />
    </Form.Item>
  )
}

export default ServicesSelect
