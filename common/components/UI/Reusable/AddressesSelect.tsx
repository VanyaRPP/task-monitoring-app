import { validateField } from '@assets/features/validators'
import { useGetAllStreetsQuery } from '@common/api/streetApi/street.api'
import { AppRoutes } from '@utils/constants'
import { Form, FormInstance, Select, Tooltip } from 'antd'
import Link from 'next/link'
import { CSSProperties, useEffect, useMemo } from 'react'

export interface AddressesSelectProps {
  form: FormInstance
  edit?: boolean
  create?: boolean
  dropdownStyle?: CSSProperties
  street?: string
  onStreetHasServiceChange?: (hasService: boolean) => void
}

const AddressesSelect: React.FC<AddressesSelectProps> = ({
  form,
  edit,
  dropdownStyle,
  street,
  onStreetHasServiceChange,
}) => {
  const streetId: string = Form.useWatch('street', form)
  const domainId: string = Form.useWatch('domain', form)

  const {
    data: streets = [],
    isLoading: isStreetsLoading,
    isError: isStreetsError,
  } = useGetAllStreetsQuery({ domainId }, { skip: !domainId })

  const options = useMemo(() => {
    return streets.map((i) => ({
      value: i._id,
      label: `${i.address} (м. ${i.city})`,
      hasService: i.hasService,
    }))
  }, [streets])

  useEffect(() => {

  if (!domainId) {
    form.setFieldsValue({ street: undefined })
    onStreetHasServiceChange?.(false)
    return
  }
  if (isStreetsLoading) return
  if (options.length === 0) {
    form.setFieldsValue({ street: undefined })
    onStreetHasServiceChange?.(false)
    return
  }
  const hasInOptions = (id?: string) =>
    !!id && options.some((o) => o.value === id)
  const currentId = form.getFieldValue('street') as string | undefined
  if (hasInOptions(currentId)) {
    const selected = options.find((o) => o.value === currentId)
    onStreetHasServiceChange?.(!!selected?.hasService)
    return
  }
  if (hasInOptions(street)) {
    const fromProp = options.find((o) => o.value === street)!
    form.setFieldsValue({ street: fromProp.value })
    onStreetHasServiceChange?.(fromProp.hasService)
    return
  }
  const firstWithService = options.find((o) => o.hasService)
  const fallback = firstWithService ?? options[0]
  form.setFieldsValue({ street: fallback.value })
  onStreetHasServiceChange?.(!!fallback.hasService)
}, [domainId, isStreetsLoading, options, street, form, onStreetHasServiceChange])

  const selectedStreet = options.find((option) => option.value === streetId)
  const showTooltip = !!selectedStreet && !selectedStreet.hasService

  return (
    <Tooltip
      title={
        <span>
          Послуг за даною адресою не знайдено! Будь ласка, оберіть іншу адресу
          або
          <Link href={AppRoutes.SERVICE}>
            додайте нову послугу за цією адресою
          </Link>
          .
        </span>
      }
      visible={showTooltip}
      placement="top"
    >
      <Form.Item name="street" label="Адреса" rules={validateField('required')}>
        <Select
          options={options}
          optionFilterProp="label"
          placeholder="Пошук адреси"
          status={isStreetsError && 'error'}
          loading={isStreetsLoading}
          disabled={isStreetsLoading || streets.length === 1 || !domainId}
          dropdownStyle={dropdownStyle}
          allowClear
          showSearch
          onChange={(value) => {
            const selected = options.find((option) => option.value === value)
            onStreetHasServiceChange?.(selected?.hasService || false)
          }}
        />
      </Form.Item>
    </Tooltip>
  )
}

export default AddressesSelect
