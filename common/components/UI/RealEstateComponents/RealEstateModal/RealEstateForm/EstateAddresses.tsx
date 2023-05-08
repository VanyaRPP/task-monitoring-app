import { useGetServicesAddressQuery } from '@common/api/serviceApi/service.api'
import { validateField } from '@common/assets/features/validators'
import { Form, Select } from 'antd'

export default function EstateAddresses() {
  const { data, isLoading } = useGetServicesAddressQuery({})

  return (
    <Form.Item name="address" label="Адреса" rules={validateField('required')}>
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
        options={data?.map((i) => ({ value: i, label: i }))}
        optionFilterProp="children"
        placeholder="Пошук адреси"
        loading={isLoading}
        showSearch
      />
    </Form.Item>
  )
}
