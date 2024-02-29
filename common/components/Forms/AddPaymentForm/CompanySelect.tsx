// TODO: Move to reusable folder same level as DomainsSelect
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
import { validateField } from '@common/assets/features/validators'
import { Form, Select } from 'antd'
import { useEffect } from 'react'

export default function CompanySelect({
  form,
  edit,
}: {
  form: any
  edit?: boolean
}) {
  const domainId = Form.useWatch('domain', form)
  const streetId = Form.useWatch('street', form)

  return domainId && streetId ? (
    <RealEstateDataFetcher
      domainId={domainId}
      streetId={streetId}
      form={form}
      edit={edit}
    />
  ) : (
    <Form.Item label="Компанія">
      <Select placeholder="Оберіть надавача послуг та адресу" disabled />
    </Form.Item>
  )
}

function RealEstateDataFetcher({ domainId, streetId, form, edit }) {
  const { data: realEstates, isLoading } = useGetAllRealEstateQuery({
    domainId,
    streetId,
  })

  const companies = realEstates?.data || []

  useEffect(() => {
    form.resetFields(['company'])
  }, [streetId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (companies?.length > 0) {
      form.setFieldValue('company', companies[0]._id)
    }
  }, [companies?.length]) // eslint-disable-line react-hooks/exhaustive-deps

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
        options={companies?.map((i) => ({
          value: i._id,
          label: i.companyName,
        }))}
        optionFilterProp="children"
        placeholder="Пошук адреси"
        // disabled={companies?.length === 1 || !edit}
        loading={isLoading}
        showSearch
      />
    </Form.Item>
  )
}
