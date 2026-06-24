import { useGetAllStreetsQuery } from '@common/api/streetApi/street.api'
import { Form, Select } from 'antd'
import React from 'react'
import { useForm } from 'antd/lib/form/Form'

interface DomainStreetsProps {
  disabled?: boolean
}

const DomainStreets: React.FC<DomainStreetsProps> = ({ disabled = false }) => {
  const { data: streets, isLoading } = useGetAllStreetsQuery({})

  return (
    <Form.Item name="streets" label="Закріплені адреси">
      <Select
        options={streets?.map((i) => ({
          value: i._id,
          label: `${i.address} (м. ${i.city})`,
        }))}
        mode="multiple"
        showSearch
        disabled={isLoading || disabled}
        placeholder="Пошук адреси"
        loading={isLoading}
        filterSort={(optionA, optionB) =>
          (optionA?.label ?? '')
            .toLowerCase()
            .localeCompare((optionB?.label ?? '').toLowerCase())
        }
        filterOption={(input, option) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
      ></Select>
    </Form.Item>
  )
}

export default DomainStreets
