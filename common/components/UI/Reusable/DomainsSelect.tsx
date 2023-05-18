import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import { validateField } from '@common/assets/features/validators'
import { Form, Select } from 'antd'

export default function DomainsSelect({ disabled, form }) {
  const { data, isLoading } = useGetDomainsQuery({})

  return (
    <Form.Item name="domain" label="Домен" rules={validateField('required')}>
      <Select
        onSelect={() => {
          // TODO: check if this should be inside street component
          form.resetFields(['street'])
        }}
        filterSort={(optionA, optionB) =>
          (optionA?.label ?? '')
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            ?.toLowerCase()
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            .localeCompare((optionB?.label ?? '')?.toLowerCase())
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        filterOption={(input, option) => (option?.label ?? '').includes(input)}
        options={data?.map((i) => ({ value: i._id, label: i.name }))}
        optionFilterProp="children"
        disabled={disabled}
        placeholder="Пошук домена"
        loading={isLoading}
        showSearch
      />
    </Form.Item>
  )
}
