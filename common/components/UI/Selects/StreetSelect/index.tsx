import { useGetDomainsQuery } from '@common/api/domainApi/domain.api'
import { useGetAllStreetsQuery } from '@common/api/streetApi/street.api'
import { validateField } from '@common/assets/features/validators'
import { IDomain } from '@common/modules/models/Domain'
import { Form, FormInstance, FormItemProps, Select, SelectProps } from 'antd'
import React, { useEffect, useMemo } from 'react'

export interface StreetSelectProps extends Omit<SelectProps, 'options' | 'mode'> {
  mode?: 'multiple' | undefined // remove 'tags' mode
  domain?: IDomain['_id']
  multiple?: boolean
}

/**
 * Base street select component with inner logic of streets loading
 *
 * @param domain The domain ID for fetching streets
 * @param ...props Rest of default `antd#Select` component props (omit `options`)
 */
export const StreetSelect: React.FC<StreetSelectProps> = ({ domain: domainId, mode, ...props }) => {
  const { data: streets, isLoading } = useGetAllStreetsQuery({ domainId })

  const options: SelectProps['options'] = useMemo(() => {
    return (
      streets?.map((street) => ({
        value: street._id,
        label: `${street.address} (м. ${street.city})`,
      })) ?? []
    )
  }, [streets])

  return (
    <Select
      mode={mode}
      options={options}
      allowClear
      showSearch
      optionFilterProp="label"
      placeholder={mode === 'multiple' ? 'Оберіть вулиці' : 'Оберіть вулицю'}
      loading={isLoading}
      labelRender={({ label }) => label ?? 'Loading...'}
      {...props}
    />
  )
}

export interface FormStreetSelectProps
  extends Omit<FormItemProps, 'name' | 'children'>,
    Omit<StreetSelectProps, 'domain' | 'status' | 'children'> {
  form?: FormInstance
}

/**
 * Form integrate `StreetSelect` with inner logic of handling relations between `street` field with other `form` fields
 *
 * @param form The form instance
 * @param selectProps The props will be transfered to inner `StreetSelect` component
 * @param ...props Rest of default `antd#Form.Item` component props (omit `name`)
 */
export const FormStreetSelect: React.FC<FormStreetSelectProps> = ({ mode, ...props }) => {
  if (mode === 'multiple') {
    return <FormMultipleStreetsSelect {...props} />
  } else {
    return <FormSingleStreetSelect {...props} />
  }
}

const FormSingleStreetSelect: React.FC<FormStreetSelectProps> = ({ form: _form, ...props }) => {
  const [form] = Form.useForm(_form)

  const domainId: string | undefined = Form.useWatch('domain', form)
  const streetId: string | undefined = Form.useWatch('street', form)

  const { data: { 0: domain } = { 0: null } } = useGetDomainsQuery(
    { domainId, limit: 1 },
    { skip: !domainId }
  )

  useEffect(() => {
    if (domainId && domain?.streets.length === 1) {
      form.setFieldValue('street', domain?.streets[0]._id)
    } else if (domainId && !domain?.streets.find((street) => street._id === streetId)) {
      form.setFieldValue('street', null)
    }
  }, [form, streetId, domain, domainId])

  return (
    <Form.Item name="street" label="Адреса" rules={validateField('required')} {...props}>
      <StreetSelect
        domain={domainId}
        disabled={domainId && domain?.streets.length === 1}
        {...props}
        status={props.status === 'warning' ? 'warning' : props.status === 'error' ? 'error' : ''}
      />
    </Form.Item>
  )
}

const FormMultipleStreetsSelect: React.FC<FormStreetSelectProps> = ({ form: _form, ...props }) => {
  const [form] = Form.useForm(_form)

  const domainId: string | undefined = Form.useWatch('domain', form)
  const streetsIds: string[] | undefined = Form.useWatch('streets', form)

  const { data: { 0: domain } = { 0: null } } = useGetDomainsQuery(
    { domainId, limit: 1 },
    { skip: !domainId }
  )

  useEffect(() => {
    if (domainId && domain?.streets.length === 1) {
      form.setFieldValue('streets', domain?.streets[0]._id)
    } else if (domainId) {
      form.setFieldValue(
        'streets',
        domain?.streets.filter((street) => streetsIds?.includes(street._id)) ?? []
      )
    }
  }, [form, streetsIds, domain, domainId])

  return (
    <Form.Item name="streets" label="Адреси" rules={validateField('required')} {...props}>
      <StreetSelect
        mode="multiple"
        domain={domainId}
        disabled={domainId && domain?.streets.length === 1}
        {...props}
        status={props.status === 'warning' ? 'warning' : props.status === 'error' ? 'error' : ''}
      />
    </Form.Item>
  )
}
