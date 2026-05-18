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
    if (domainId && options.length > 0) {
      if (options.length === 1) {
        form.setFieldsValue({ street: options[0].value })
        onStreetHasServiceChange?.(options[0].hasService)
      } else {
        const firstStreetWithService = options.find(
          (option) => option.hasService
        )

        if (firstStreetWithService) {
          street
            ? form.setFieldsValue({ street: street })
            : form.setFieldsValue({ street: firstStreetWithService.value })
          onStreetHasServiceChange?.(firstStreetWithService.hasService)
        } else {
          form.setFieldsValue({ street: undefined })
          onStreetHasServiceChange?.(false)
        }
      }
    } else {
      form.setFieldsValue({ street: undefined })
      onStreetHasServiceChange?.(false)
    }
  }, [domainId, options, form, street])

  const selectedStreet = options.find((option) => option.value === streetId)
  const showNoServiceTooltip = !!selectedStreet && !selectedStreet.hasService
  const showNoAddressesTooltip =
    !!domainId && !isStreetsLoading && options.length === 0
  const tooltipContent = showNoAddressesTooltip ? (
    <span>
      За вибраним Надавачем послуг немає жодної адреси. Будь ласка,{' '}
      <Link href={AppRoutes.STREETS}>додайте адресу</Link>.
    </span>
  ) : showNoServiceTooltip ? (
    <span>
      Послуг за даною адресою не знайдено! Будь ласка, оберіть іншу адресу або{' '}
      <Link href={AppRoutes.SERVICE}>додайте нову послугу за цією адресою</Link>
      .
    </span>
  ) : null

  return (
    <Tooltip
      title={tooltipContent}
      visible={showNoAddressesTooltip || showNoServiceTooltip}
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
