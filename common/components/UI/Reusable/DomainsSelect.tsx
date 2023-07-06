import { validateField } from '@common/assets/features/validators'
import { useCompanyPageContext } from '@common/components/DashboardPage/blocks/realEstates'
import useDomain from '@common/modules/hooks/useDomain'
import { Form, Select } from 'antd'
import { useEffect } from 'react'

export default function DomainsSelect({
  form,
}: {
  form: any
}) {
  // TODO: recheck
  // in preview mode we need to prevent all data fetching. only single
  const { domainId } = useCompanyPageContext()
  const { data, isLoading } = useDomain({ domainId })

  useEffect(() => {
    if (data?.length === 1) {
      form.setFieldValue('domain', data[0]._id)
    }
  }, [data?.length]) // eslint-disable-line react-hooks/exhaustive-deps

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
        disabled={data?.length === 1}
        placeholder="Пошук домена"
        loading={isLoading}
        showSearch
      />
    </Form.Item>
  )
}
