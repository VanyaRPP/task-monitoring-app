import { validateField } from '@assets/features/validators'
import { useGetAllStreetsQuery } from '@common/api/streetApi/street.api'
import { Form, Select } from 'antd'
import React from 'react'

interface DomainStreetsProps {
  disabled?: boolean
}

const DomainStreets: React.FC<DomainStreetsProps> = ({ disabled = false }) => {
  const { data: streets, isLoading } = useGetAllStreetsQuery({})

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
            .toLowerCase()
            .localeCompare((optionB?.label ?? '').toLowerCase())
        }
        filterOption={(input, option) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
        options={streets?.map((i) => ({
          value: i._id,
          label: `${i.address} (м. ${i.city})`,
        }))}
        optionFilterProp="children"
        placeholder="Пошук адреси"
        loading={isLoading}
        showSearch
        disabled={disabled}
      />
    </Form.Item>
  )
}

export default DomainStreets
