// TODO: Move to reusable folder same level as DomainsSelect
import { validateField } from '@assets/features/validators'
import { useGetAllRealEstateQuery } from '@common/api/realestateApi/realestate.api'
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
  const month = Form.useWatch('monthService', form)

  const isDisabled = !domainId || !streetId || !month

  return isDisabled ? (
    <Form.Item label="Компанія">
      <Select placeholder="Оберіть надавача послуг та адресу" disabled />
    </Form.Item>
  ) : (
    <RealEstateDataFetcher
      domainId={domainId}
      streetId={streetId}
      form={form}
      edit={edit}
    />
  )
}

function RealEstateDataFetcher({ domainId, streetId, form, edit }) {
  const { data: { data: companies } = { data: [] }, isLoading } =
    useGetAllRealEstateQuery({
      domainId,
      streetId,
    })

  useEffect(() => {
    if (!edit) {
      form.setFieldValue('company', undefined)
    }
  }, [form, streetId])

  useEffect(() => {
    if (!edit) {
      if (companies?.length === 1) {
        form.setFieldValue('company', companies[0]._id)
      } else if (companies?.length > 0) {
        form.setFieldValue('company', companies[0]._id)
      }
    }
  }, [form, companies, edit])

  return (
    <Form.Item
      name="company"
      label="Компанія"
      rules={validateField('required')}
    >
      <Select
        filterSort={(optionA, optionB) =>
          // TODO: invistagate ts-ignore issue
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

        filterOption={(input, option) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
        options={companies?.map((i) => ({
          value: i._id,
          label: i.companyName,
        }))}
        optionFilterProp="children"
        placeholder="Пошук адреси"
        disabled={companies?.length === 1 || edit || isLoading}
        loading={isLoading}
        showSearch
      />
    </Form.Item>
  )
}
