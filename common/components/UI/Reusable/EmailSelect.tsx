import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import { validateField } from '@common/assets/features/validators'
import { Form, Select } from 'antd'
import { useForm } from 'antd/lib/form/Form'
import { useEffect } from 'react'

interface EmailSelectProps {
  form: any
}

export default function EmailSelect({ form }: EmailSelectProps) {
  const { data, isLoading } = useGetDomainsQuery({})
  const [formInstance] = useForm() // Access the form instance

  useEffect(() => {
    if (data) {
      const adminEmails = data.data.reduce((uniqueAdminEmails, domain) => {
        const newAdminEmails = domain.adminEmails.filter(
          (email) => !uniqueAdminEmails.includes(email)
        )
        return [...uniqueAdminEmails, ...newAdminEmails]
      }, [])
      formInstance.setFieldsValue({ adminEmails }) // Use form instance's setFieldsValue
    }
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  const adminEmailOptions =
    data?.data.reduce((uniqueAdminEmails, domain) => {
      const newAdminEmails = domain.adminEmails.filter(
        (email) => !uniqueAdminEmails.includes(email)
      )
      return [...uniqueAdminEmails, ...newAdminEmails]
    }, []) || []

  return (
    <Form.Item
      name="adminEmails"
      label="Адміністратори"
      rules={[
        { required: true },
        ...validateField('email'), // Use the imported validateField function for email validation
      ]}
    >
      <Select
        mode="tags"
        disabled={isLoading}
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
