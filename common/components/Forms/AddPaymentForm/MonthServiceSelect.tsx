import { validateField } from '@assets/features/validators'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { getFormattedDate } from '@utils/helpers'
import { Form, Select } from 'antd'
import { useEffect } from 'react'

export default function MonthServiceSelect({
  form,
  edit,
}: {
  form: any
  edit?: boolean
}) {
  const domainId = Form.useWatch('domain', form)
  const streetId = Form.useWatch('street', form)

  return domainId && streetId ? (
    <MonthServiceDataFetcher
      domainId={domainId}
      streetId={streetId}
      form={form}
      edit={edit}
    />
  ) : (
    <Form.Item label="Місяць">
      <Select placeholder="Оберіть надавача послуг та адресу" disabled />
    </Form.Item>
  )
}

function MonthServiceDataFetcher({ domainId, streetId, form, edit }) {
  const { data: monthsServices, isLoading } = useGetAllServicesQuery({
    domainId,
    streetId,
  })

  useEffect(() => {
    form.resetFields(['monthService'])
  }, [streetId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (monthsServices?.data?.length === 1) {
      form.setFieldValue('monthService', monthsServices.data[0]._id)
    }
  }, [monthsServices?.data.length]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item
      rules={validateField('required')}
      name="monthService"
      label="Місяць"
    >
      <Select
        options={monthsServices?.data.map((i) => ({
          value: i._id,
          label: getFormattedDate(i.date, 'MMMM YYYY'),
        }))}
        optionFilterProp="label"
        placeholder="Місяць"
        disabled={monthsServices?.data?.length === 1 || edit}
        loading={isLoading}
        showSearch
      />
    </Form.Item>
  )
}
