import { useEffect } from 'react'
import { Form, Select } from 'antd'
import { useForm } from 'antd/lib/form/Form'
import { validateField } from '@common/assets/features/validators'
import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'

interface EmailSelectProps {
  form: any
}

export default function EmailSelect({ form }: EmailSelectProps) {
  const { data, isLoading } = useGetDomainsQuery({})
  const [formInstance] = useForm() // Access the form instance

  useEffect(() => {
    if (data) {
      const adminEmails = data.flatMap((domain) => domain.adminEmails)
      formInstance.setFieldsValue({ adminEmails }) // Use form instance's setFieldsValue
    }
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  // Extract all admin email options from the data object
  const adminEmailOptions = data?.flatMap((domain) => domain.adminEmails) || []

  return (
    <Form.Item
      name="adminEmails"
      label="Адміністратори"
      rules={validateField('email')}
    >
      <Select
        mode="tags"
        placeholder="Пошти адмінів компанії"
        loading={isLoading}
        onSelect={() => {
          // Reset the value of "adminEmails" field when cleared
          formInstance.setFieldsValue({ adminEmails: [] }) // Use form instance's setFieldsValue
        }}
        filterOption={(inputValue, option) => {
          if (typeof option?.value === 'string') {
            return option.value.toLowerCase().includes(inputValue.toLowerCase())
          }
          return false
        }}
        showSearch
      >
        {adminEmailOptions.map((email) => (
          <Select.Option key={email} value={email}>
            {email}
          </Select.Option>
        ))}
      </Select>
    </Form.Item>
  )
}
