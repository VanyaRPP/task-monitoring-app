import { validateField } from '@assets/features/validators'
import { useGetAllStreetsQuery } from '@common/api/streetApi/street.api'
import { Form, Select } from 'antd'
import React from 'react'
import { useForm } from 'antd/lib/form/Form'

interface DomainStreetsProps {
  disabled?: boolean
}

const DomainStreets: React.FC<DomainStreetsProps> = ({ disabled = false }) => {
  const { data: streets, isLoading } = useGetAllStreetsQuery({})
  const [formInstance] = useForm() // Access the form instance
  return (
    <Form.Item
      name="streets"
      label="Закріплені адреси"
      rules={validateField('required')}
    >

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
        onSelect={() => {
          // Reset the value of "adminEmails" field when cleared
          formInstance.setFieldsValue({ adminEmails: [] }) // Use form instance's setFieldsValue
        }}
        filterOption={(inputValue, option) => {
        //  debugger
          if (typeof option?.value === 'string') {
            return option.label.toLowerCase().includes(inputValue.toLowerCase())
          }
          return false
        }}

      >
        {/*{*/}
        {/*  adminEmailOptions.map((email) => (*/}
        {/*    <Select.Option key={email} value={email}>*/}
        {/*      {email}*/}
        {/*    </Select.Option>*/}
        {/*  ))}*/}

      </Select>




   {/*   <Select*/}
   {/*     mode="tags"*/}
   {/*     filterSort={(optionA, optionB) =>*/}
   {/*       (optionA?.label ?? '')*/}
   {/*         .toLowerCase()*/}
   {/*         .localeCompare((optionB?.label ?? '').toLowerCase())*/}
   {/*     }*/}
   {/*     filterOption={(input, option) => {*/}
   {/*       console.log(input,option)*/}
   {/*//       debugger*/}
   {/*       return (option?.label ?? '').toLowerCase().includes(input.toLowerCase())*/}
   {/*     }*/}
   {/*     }*/}
   {/*     options={streets?.map((i) => ({*/}
   {/*       value: i._id,*/}
   {/*       label: `${i.address} (м. ${i.city})`,*/}
   {/*     }))}*/}
   {/*     optionFilterProp="children"*/}
   {/*     placeholder="Пошук адреси111111111111111111111111111111"*/}
   {/*     loading={isLoading}*/}
   {/*     showSearch*/}
   {/*     disabled={disabled}*/}
   {/*   />*/}
    </Form.Item>
  )
}

export default DomainStreets
