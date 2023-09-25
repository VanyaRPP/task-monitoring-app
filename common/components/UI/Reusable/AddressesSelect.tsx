import { useCompanyPageContext } from '@common/components/DashboardPage/blocks/realEstates'
import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import { validateField } from '@common/assets/features/validators'
import { IDomain } from '@common/modules/models/Domain'
import { Form, Select } from 'antd'
import { useEffect } from 'react'

export default function AddressesSelect({
  form,
}: {
  form: any
}) {
  const { streetId } = useCompanyPageContext()
  const domainId = Form.useWatch('domain', form)
  const { data = [], isLoading } = useGetDomainsQuery({ domainId: domainId || undefined })
  const domainObj = data.length > 0 ? data[0] : {} as IDomain
  const temp = (domainObj?.streets as any[]) || [] // eslint-disable-line react-hooks/exhaustive-deps
  const singleStreet = streetId && temp.find((i) => i._id === streetId)
  const streets = singleStreet ? [singleStreet] : temp

  useEffect(() => {
    if (streets?.length === 1) {
      form.setFieldValue('street', streets[0]._id)
    }
  }, [streets?.length]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item name="street" label="Адреса" rules={validateField('required')}>
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
        filterOption={(input, option) => (option?.label ?? '').includes(input)}
        options={
          streets?.map((i) => ({
            value: i._id,
            label: `${i.address} (м. ${i.city})`,
          })) || []
        }
        optionFilterProp="children"
        placeholder="Пошук адреси"
        disabled={isLoading || !domainId || streets?.length === 1}
        loading={isLoading}
        showSearch
      />
    </Form.Item>
  )
}
