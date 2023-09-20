// TODO: Move to reusable folder same level as DomainsSelect
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { validateField } from '@common/assets/features/validators'
import { Form, Select } from 'antd'
import { useEffect } from 'react'

export default function CompanySelect({ form }) {
  const domainId = Form.useWatch('domain', form)
  const streetId = Form.useWatch('street', form)

  return domainId && streetId ? (
    <RealEstateDataFetcher
      domainId={domainId}
      streetId={streetId}
      form={form}
    />
  ) : (
    <Form.Item label="Компанія">
      <Select placeholder="Оберіть домен та вулицю" disabled />
    </Form.Item>
  )
}

function RealEstateDataFetcher({ domainId, streetId, form }) {
  const { data: companies, isLoading } = useGetAllRealEstateQuery({
    domainId,
    streetId,
  })

  useEffect(() => {
    form.resetFields(['company'])
  }, [streetId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (companies?.data?.length === 1) {
      form.setFieldValue('company', companies[0]._id)
    }
  }, [companies?.data?.length]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item
      name="company"
      label="Компанія"
      rules={validateField('required')}
    >
      <Select
        filterSort={(optionA, optionB) =>
          (optionA?.label ?? '')
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            ?.toLowerCase()
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            .localeCompare((optionB?.label ?? '').toLowerCase())
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        filterOption={(input, option) => (option?.label ?? '').includes(input)}
        options={companies?.data?.map((i) => ({
          value: i._id,
          label: i.companyName,
        }))}
        optionFilterProp="children"
        placeholder="Пошук адреси"
        disabled={companies?.data?.length === 1}
        loading={isLoading}
        showSearch
      />
    </Form.Item>
  )
}
