import { validateField } from '@assets/features/validators'
import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import { Form, Select } from 'antd'
import { useForm } from 'antd/lib/form/Form'
import { useEffect } from 'react'

interface EmailSelectProps {
  form: any
  disabled?: boolean
  required?: boolean
}

export default function EmailSelect({
  form,
  disabled = false,
  required = true,
}: EmailSelectProps) {
  const { data, isLoading } = useGetDomainsQuery({})
  const [formInstance] = useForm() // Access the form instance

  useEffect(() => {
    if (data) {
      const adminEmails = data.reduce((uniqueAdminEmails, domain) => {
        const newAdminEmails = domain.adminEmails.filter(
          (email) => !uniqueAdminEmails.includes(email)
        )
        return [...uniqueAdminEmails, ...newAdminEmails]
      }, [])
      formInstance.setFieldsValue({ adminEmails }) // Use form instance's setFieldsValue
    }
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  const adminEmailOptions =
    data?.reduce((uniqueAdminEmails, domain) => {
      const newAdminEmails = domain.adminEmails.filter(
        (email) => !uniqueAdminEmails.includes(email)
      )
      return [...uniqueAdminEmails, ...newAdminEmails]
    }, []) || []

  return (
    <Form.Item
      name="adminEmails"
      label="Адміністратори"
      required={required}
      rules={[
        { required },
        ...validateField('email'), // Use the imported validateField function for email validation
      ]}
    >
      <Select
        mode="tags"
        showSearch
        disabled={isLoading || disabled}
        placeholder="Пошти адмінів компанії"
        loading={isLoading}
        filterOption={(inputValue, option) => {
          if (typeof option?.value === 'string') {
            return option?.key?.toLowerCase()?.includes(inputValue?.toLowerCase())
          }
          return false
        }}
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
