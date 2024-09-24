import { validateField } from '@assets/features/validators'
import { useGetAllStreetsQuery } from '@common/api/streetApi/street.api'
import { Form, FormInstance, Select } from 'antd'
import { CSSProperties, useEffect, useMemo } from 'react'

export interface AddressesSelectProps {
  form: FormInstance
  edit?: boolean
  dropdownStyle?: CSSProperties
}

const AddressesSelect: React.FC<AddressesSelectProps> = ({
  form,
  edit,
  dropdownStyle,
}) => {
  const streetId: string = Form.useWatch('street', form)
  const domainId: string = Form.useWatch('domain', form)

  const {
    data: streets = [],
    isLoading: isStreetsLoading,
    isError: isStreetsError,
  } = useGetAllStreetsQuery({ domainId })

  const options = useMemo(() => {
    return streets.map((i) => ({
      value: i._id,
      label: `${i.address} (м. ${i.city})`,
    }))
  }, [streets])

  useEffect(() => {
    if (!edit && domainId) {
      form.setFieldsValue({ street: options[0]?.value })
    } else if (!edit && !options.some((option) => option.value === streetId)) {
      form.setFieldsValue({ street: undefined })
    }
  }, [domainId, form, options, streetId, edit])
  return (
    <Form.Item name="street" label="Адреса" rules={validateField('required')}>
      <Select
        options={options}
        optionFilterProp="label"
        placeholder="Пошук адреси"
        status={isStreetsError && 'error'}
        loading={isStreetsLoading}
        disabled={isStreetsLoading || streets.length === 1 || !domainId || edit}
        dropdownStyle={dropdownStyle}
        allowClear
        showSearch
      />
    </Form.Item>
  )
}

export default AddressesSelect
