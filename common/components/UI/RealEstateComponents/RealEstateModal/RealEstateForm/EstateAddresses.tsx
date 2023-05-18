// TODO: recheck and maybe remove
import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import { useGetServicesAddressQuery } from '@common/api/serviceApi/service.api'
import { validateField } from '@common/assets/features/validators'
import { Form, Select } from 'antd'

export default function EstateAddresses({ form }) {
  const { data, isLoading } = useGetDomainsQuery({})
  const domain = Form.useWatch('domain', form)
  const domainObj = data?.find((i) => i._id === domain)
  const streets = domainObj?.streets || []

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
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        filterOption={(input, option) => (option?.label ?? '').includes(input)}
        options={streets?.map((i) => ({ value: i._id, label: i.address }))}
        optionFilterProp="children"
        placeholder="Пошук адреси"
        disabled={!domain}
        loading={isLoading}
        showSearch
      />
    </Form.Item>
  )
}
