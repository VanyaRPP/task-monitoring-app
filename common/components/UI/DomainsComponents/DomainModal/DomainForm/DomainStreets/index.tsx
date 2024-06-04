import { useGetStreetsQuery } from '@common/api/streetApi/street.api'
import { validateField } from '@common/assets/features/validators'
import { Form, Select } from 'antd'
import React from 'react'

const DomainStreets: React.FC = () => {
  const { data: streets, isLoading } = useGetStreetsQuery({})

  return (
    <Form.Item
      name="streets"
      label="Закріплені адреси"
      rules={validateField('required')}
    >
      <Select
        mode="tags"
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
        options={streets?.data.map((i) => ({
          value: i._id,
          label: `${i.address} (м. ${i.city})`,
        }))}
        optionFilterProp="children"
        placeholder="Пошук адреси"
        loading={isLoading}
        showSearch
      />
    </Form.Item>
  )
}

export default DomainStreets
