import { getFormattedDate } from '@assets/features/formatDate'
import { validateField } from '@assets/features/validators'
import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
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
  const { data: { data: services } = { data: [] }, isLoading } = useGetAllServicesQuery({
    domainId,
    streetId,
  })

  useEffect(() => {
    form.setFieldValue('monthService', undefined)
  }, [form, streetId])

  useEffect(() => {
    if (services.length === 1) {
      form.setFieldValue('monthService', services[0]._id)
    }
  }, [services.length]) 

  return (
    <Form.Item
      rules={validateField('required')}
      name="monthService"
      label="Місяць"
    >
      <Select
        options={services.map((i) => ({
          value: i._id,
          label: getFormattedDate(i.date, 'MMMM YYYY'),
        }))}
        optionFilterProp="label"
        placeholder="Місяць"
        disabled={services.length === 1 || edit || isLoading} 
        loading={isLoading}
        showSearch
      />
    </Form.Item>
  )
}
