import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import { validateField } from '@common/assets/features/validators'
import { Form, Select } from 'antd'
import { useEffect } from 'react'

export default function AddressesSelect({
  disabled,
  form,
}: {
  disabled?: boolean
  form: any
}) {
  const { data, isLoading } = useGetDomainsQuery({})
  const domain = Form.useWatch('domain', form)
  const domainObj = data?.find((i) => i._id === domain)
  const streets = domainObj?.streets || [] // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (streets.length === 1) {
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
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        filterOption={(input, option) => (option?.label ?? '').includes(input)}
        options={streets?.map((i) => ({ value: i._id, label: i.address }))}
        optionFilterProp="children"
        placeholder="Пошук адреси"
        disabled={!domain || streets?.length === 1 || disabled}
        loading={isLoading}
        showSearch
      />
    </Form.Item>
  )
}
