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
  const monthService: string = Form.useWatch('monthService', form)

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
    const serviceMonths = services?.map(i => dayjs(i.date).startOf('month').toISOString()) || []
    const currentMonths = Array.from({ length: 12 }, (_, i) => dayjs().subtract(i, 'month').startOf('month').toISOString())
    const allMonths = [...new Set([...serviceMonths, ...currentMonths])]
    allMonths.sort((a, b) => dayjs(b).diff(dayjs(a)))
    return allMonths.map(month => ({
      value: month,
      label: dayjs(month).format('MMMM YYYY'),
    }))
  }, [services])

  useEffect(() => {
    if (!edit) {
      if (options.length === 1) {
        form.setFieldsValue({ monthService: options[0].value })
      } else if (
        !monthService ||
        !options.some((option) => option.value === monthService)
      ) {
        form.setFieldsValue({ monthService: options[0]?.value })
      }
    }
  }, [form, options, monthService, edit])

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
