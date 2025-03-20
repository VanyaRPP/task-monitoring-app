import { validateField } from '@assets/features/validators'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { Form, FormInstance, Select } from 'antd'
import { CSSProperties, useEffect, useMemo } from 'react'

export interface ServicesSelectProps {
  form: FormInstance
  dropdownStyle?: CSSProperties
}

const ServicesSelect: React.FC<ServicesSelectProps> = ({
  form,
  dropdownStyle,
}) => {
  const domainId: string = Form.useWatch('domain', form)

  const {
    data: servicesData,
    isLoading,
    isError,
  } = useGetAllServicesQuery({ domainId }, { skip: !domainId })

  const services = servicesData?.data ?? []

  const options = useMemo(() => {
    return services.map((service) => ({
      value: service._id,
      label: service?.name,
    }))
  }, [services])

  useEffect(() => {
    if (!domainId) {
      form.setFieldsValue({ service: undefined })
    }
  }, [domainId, form])

  return (
    <Form.Item name="service" label="Послуга" rules={validateField('required')}>
      <Select
        options={options}
        placeholder="Оберіть послугу"
        status={isError ? 'error' : ''}
        loading={isLoading}
        disabled={isLoading || !domainId}
        dropdownStyle={dropdownStyle}
        allowClear
        showSearch
      />
    </Form.Item>
  )
}

export default ServicesSelect