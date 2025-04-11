import { Form, FormInstance, Select } from 'antd'
import { CSSProperties, useMemo, useEffect, useState } from 'react'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { useGetCustomServicesByDomainQuery } from '@common/api/customServicesApi/customServices.api'


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
  const { data: servicesData, isLoading, isError } = useGetAllServicesQuery({ domainId })

  const servicesList = useMemo(() => {
    if (!servicesData) return []
    return servicesData.data.map((service: any) => ({
      _id: service._id,
      name: service.domain.name
    }))
  }, [servicesData])

  const services = useMemo(() => {
    const all = [...servicesList, ...customServices]
    const unique = all.reduce((acc, curr) => {
      if (!acc.find((s) => s._id === curr._id)) acc.push(curr)
      return acc
    }, [] as { _id: string; name: string }[])
  
    return unique.sort((a, b) => a.name.localeCompare(b.name))
  }, [servicesList, customServices])
  
  const rawValues = form.getFieldValue('services') || []
  const options = useMemo(() => {
    const base = services.map((service) => ({
      value: service._id,
      label: service.name,
    }))
  
    const raw = form.getFieldValue('services') || []
  
    const extraFromForm = raw.map((item: any) => {
      const value = typeof item === 'string'
        ? item
        : item.value || item._id
  
      const label = typeof item === 'object' && (item.label || item.name)
        || services.find((s) => s._id === value)?.name
        || value 
  
      const alreadyInOptions = base.find((opt) => opt.value === value)
  
      return !alreadyInOptions ? { value, label } : null
    }).filter(Boolean)
  
    return [...base, ...extraFromForm]
  }, [services, form])
  
  const formServices = rawValues.map((item: any) => {
    if (typeof item === 'string') {
      const label = options.find((opt) => opt.value === item)?.label || item
      return { value: item, label }
    }
  
    if (item?.value && item?.label) return item
  
    if (item?._id && item?.name) return { value: item._id, label: item.name }
  
    if (item?.name) return { value: item.name, label: item.name }
  
    return { value: String(item), label: String(item) }
  })
  
  useEffect(() => {
    const current = form.getFieldValue('services')
    const shouldInit = !Array.isArray(current) || !current.length
  
    if (shouldInit && customServices.length) {
      const selected = customServices.map(({ _id, name }) => ({
        value: _id,
        label: name,
      }))
  
      form.setFieldsValue({ services: selected }) 
      onServicesChange?.(selected.map((s) => s.value)) 
    }
  }, [customServices, form, onServicesChange])
  

  const handleChange = (selected: { value: string; label: string }[]) => {
    form.setFieldsValue({ services: selected }) 

    onServicesChange?.(selected.map((s) => s.value))
  }

  if (isLoading) return <div>Завантаження послуг...</div>
  if (isError) return <div>Помилка при завантаженні послуг</div>

  return (
    <Form.Item label="Послуги" required>
      <Select
        mode="multiple"
        labelInValue
        options={options}
        placeholder="Оберіть послуги"
        optionFilterProp="label"
        dropdownStyle={dropdownStyle}
        allowClear
        showSearch
        value={formServices}
        onChange={handleChange}
      />
    </Form.Item>
  )
}

export default ServicesSelect
