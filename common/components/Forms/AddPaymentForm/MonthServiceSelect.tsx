import { useGetAllServicesQuery } from '@common/api/serviceApi/service.api'
import { validateField } from '@common/assets/features/validators'
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
    if (monthsServices && monthsServices.data?.length > 0) {
      form.setFieldValue('monthService', monthsServices.data[0]._id)
    }
  }, [monthsServices?.data.length]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item
      rules={!edit && validateField('required')}
      name="monthService"
      label="Місяць"
    >
      <Select
        filterOption={(input, option) => (option?.label ?? '').includes(input)}
        options={monthsServices?.data.map((i) => ({
          value: i._id,
          label: getFormattedDate(i.date),
        }))}
        optionFilterProp="children"
        placeholder="Місяць"
        disabled={edit || monthsServices && monthsServices.data?.length <= 1}
        loading={isLoading}
        showSearch
      />
    </Form.Item>
  )
}
