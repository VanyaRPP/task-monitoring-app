import { getFormattedDate } from '@assets/features/formatDate'
import { validateField } from '@assets/features/validators'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { Form, FormInstance, Select } from 'antd'
import { useEffect, useMemo } from 'react'

export interface MonthServiceSelectProps {
  form: FormInstance
  edit?: boolean
  disabled?: boolean
}

const MonthServiceSelect: React.FC<MonthServiceSelectProps> = ({
  form,
  edit,
  disabled,
}) => {
  const streetId: string = Form.useWatch('street', form)
  const domainId: string = Form.useWatch('domain', form)
  const serviceId: string = Form.useWatch('service', form)

  const {
    data: { data: services } = { data: [] },
    isLoading: isServicesLoading,
    isError: isServicesError,
  } = useGetAllServicesQuery(
    {
      domainId,
      streetId,
    },
    { skip: !domainId || !streetId }
  )

  const options = useMemo(() => {
    return services.map((i) => ({
      value: i._id,
      label: getFormattedDate(i.date, 'MMMM YYYY'),
    }))
  }, [services])

  useEffect(() => {
    if (!edit && options.length === 1) {
      form.setFieldsValue({ monthService: options[0].value })
    } else if (!edit && !options.some((option) => option.value === serviceId)) {
      form.setFieldsValue({ monthService: undefined })
    }
  }, [form, options, serviceId, edit])

  return (
    <Form.Item
      name="monthService"
      label="Місяць"
      rules={validateField('required')}
    >
      <Select
        options={options}
        optionFilterProp="label"
        placeholder="Місяць"
        status={isServicesError && 'error'}
        loading={isServicesLoading}
        disabled={
          disabled ||
          isServicesLoading ||
          services.length === 1 ||
          !streetId ||
          !domainId ||
          edit
        }
        allowClear
        showSearch
      />
    </Form.Item>
  )
}

export default MonthServiceSelect
