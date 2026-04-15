import { validateField } from '@assets/features/validators'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import {
  buildMonthServicePlaceholder,
  isMonthServicePlaceholder,
  parseMonthServicePlaceholder,
} from '@common/components/Forms/AddPaymentForm/month-service-placeholder'
import { Form, FormInstance, Select } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo } from 'react'

const ROLLING_MONTH_COUNT = 12

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
    const byMonthKey = new Map<
      string,
      { value: string; label: string }
    >()

    for (const svc of services ?? []) {
      const key = dayjs(svc.date).startOf('month').format('YYYY-MM')
      byMonthKey.set(key, {
        value: svc._id,
        label: dayjs(svc.date).format('MMMM YYYY'),
      })
    }

    for (let i = 0; i < ROLLING_MONTH_COUNT; i++) {
      const m = dayjs().subtract(i, 'month').startOf('month')
      const key = m.format('YYYY-MM')
      if (!byMonthKey.has(key)) {
        byMonthKey.set(key, {
          value: buildMonthServicePlaceholder(m),
          label: m.format('MMMM YYYY'),
        })
      }
    }

    const sortKey = (opt: { value: string }) => {
      if (isMonthServicePlaceholder(opt.value)) {
        return parseMonthServicePlaceholder(opt.value).valueOf()
      }
      const svc = services?.find((s) => s._id === opt.value)
      return svc ? dayjs(svc.date).valueOf() : 0
    }

    return [...byMonthKey.values()].sort((a, b) => sortKey(b) - sortKey(a))
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
