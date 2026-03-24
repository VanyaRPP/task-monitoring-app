import { getFormattedDate } from '@assets/features/formatDate'
import { validateField } from '@assets/features/validators'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { Form, FormInstance, Select } from 'antd'
import { useEffect, useMemo } from 'react'
import dayjs from 'dayjs'

export interface MonthServiceSelectProps {
  form: FormInstance
  edit?: boolean
}

const MonthServiceSelect: React.FC<MonthServiceSelectProps> = ({
  form,
  edit,
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
  if (services?.length > 0) {
    return services.map((i) => ({
      value: i._id,
      label: getFormattedDate(i.date, 'MMMM YYYY'),
    }));
  }

  return Array.from({ length: 12 }, (_, i) => {
    const month = dayjs().subtract(i, 'month').startOf('month');
    return {
      value: month.toISOString(),
      label: month.format('MMMM YYYY'),
    };
  });
}, [services]);

  useEffect(() => {
    if (!edit) {
      if (options.length === 1) {
        form.setFieldsValue({ monthService: options[0].value })
      } else if (
        !serviceId ||
        !options.some((option) => option.value === serviceId)
      ) {
        form.setFieldsValue({ monthService: options[0]?.value })
      }
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
        status={isServicesError ? 'error' : undefined}
        loading={isServicesLoading}
        disabled={
          isServicesLoading || 
          !streetId || 
          !domainId
        }
        allowClear
        showSearch
      />
    </Form.Item>
  )
}

export default MonthServiceSelect
