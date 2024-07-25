import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import { validateField } from '@common/assets/features/validators'
import { Form, FormInstance, FormItemProps, Select, SelectProps } from 'antd'
import { useEffect, useMemo } from 'react'

export type DomainSelectProps = Omit<SelectProps, 'options'>

/**
 * Base street select component with inner logic of domains loading
 *
 * @param ...props Rest of default `antd#Select` component props (omit `options`)
 */
export const DomainSelect: React.FC<DomainSelectProps> = (props) => {
  const { data: domains, isLoading } = useGetDomainsQuery({})

  const options: SelectProps['options'] = useMemo(() => {
    return (
      domains?.map((domain) => ({
        value: domain._id,
        label: domain.name,
      })) ?? []
    )
  }, [domains])

  return (
    <Select
      options={options}
      allowClear
      showSearch
      optionFilterProp="label"
      placeholder="Оберіть домен"
      loading={isLoading}
      labelRender={({ label }) => label ?? 'Loading...'}
      {...props}
    />
  )
}

export interface FormDomainSelectProps extends Omit<FormItemProps, 'name'> {
  form?: FormInstance
  selectProps?: DomainSelectProps
}

/**
 * Form integrate `DomainSelect` with inner logic
 *
 * @param form The form instance
 * @param selectProps The props will be transfered to inner `DomainSelect` component
 * @param ...props Rest of default `antd#Form.Item` component props (omit `name`)
 */
export const FormDomainSelect: React.FC<FormDomainSelectProps> = ({
  form: _form,
  selectProps,
  ...props
}) => {
  const [form] = Form.useForm(_form)

  const { data: domains = [] } = useGetDomainsQuery({})

  useEffect(() => {
    if (domains?.length === 1) {
      form.setFieldValue('domain', domains[0]._id)
    }
  }, [form, domains])

  return (
    <Form.Item name="domain" label="Надавач послуг" rules={validateField('required')} {...props}>
      <DomainSelect disabled={domains?.length === 1} {...selectProps} />
    </Form.Item>
  )
}
