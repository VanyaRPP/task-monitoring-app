import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import { validateField } from '@assets/features/validators'
import { Form, FormInstance, Select } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useGetCurrentUserQuery } from '@common/api/userApi/user.api'

export interface DomainsSelectProps {
  form: FormInstance
  edit?: boolean
}

const DomainsSelect: React.FC<DomainsSelectProps> = ({ form, edit }) => {
  const [domains, setDomains] = useState([])
  const {
    data: fetchedDomains = [],
    isLoading: isDomainsLoading,
    isError: isDomainsError,
  } = useGetDomainsQuery({})

  useEffect(() => {
    if (fetchedDomains.length) {
      setDomains(fetchedDomains)
    }
  }, [fetchedDomains])

  const options = useMemo(() => {
    return domains.map((i) => ({
      value: i._id,
      label: i.name,
    }))
  }, [domains])

  useEffect(() => {
    if (!edit && options.length === 1) {
      form.setFieldsValue({ domain: options[0].value })
    }
  }, [form, options, edit])

  return (
    <Form.Item
      name="domain"
      label="Надавач послуг"
      rules={validateField('required')}
    >
      <Select
        options={options}
        optionFilterProp="label"
        placeholder="Пошук надавача послуг"
        status={isDomainsError && 'error'}
        loading={isDomainsLoading}
        disabled={isDomainsLoading || domains.length === 1 || edit}
        allowClear
        showSearch
      />
    </Form.Item>
  )
}

export default DomainsSelect
