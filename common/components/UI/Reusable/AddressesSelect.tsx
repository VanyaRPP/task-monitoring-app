import { validateField } from '@assets/features/validators'
import { useGetAllStreetsQuery } from '@common/api/streetApi/street.api'
import { AppRoutes } from '@utils/constants'
import { Form, FormInstance, Select, Tooltip } from 'antd'
import Link from 'next/link'
import { CSSProperties, useEffect, useMemo } from 'react'

export interface AddressesSelectProps {
  form: FormInstance
  edit?: boolean
  dropdownStyle?: CSSProperties
  onStreetHasServiceChange?: (hasService: boolean) => void
}

const AddressesSelect: React.FC<AddressesSelectProps> = ({
  form,
  edit,
  dropdownStyle,
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
    if (domainId) {
      if (options.length === 1) {
        form.setFieldsValue({ street: options[0].value })
        onStreetHasServiceChange?.(options[0].hasService)
      } else {
        const firstStreetWithService = options.find(
          (option) => option.hasService
        )

        if (firstStreetWithService) {
          form.setFieldsValue({ street: firstStreetWithService.value })
          onStreetHasServiceChange(firstStreetWithService.hasService)
        } else {
          form.setFieldsValue({ street: undefined })
          onStreetHasServiceChange(false)
        }
      }
    }
  }, [domainId, options, form, onStreetHasServiceChange])

  const selectedStreet = options.find((option) => option.value === streetId)
  const showTooltip = !!streetId && !selectedStreet.hasService

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
          disabled={
            isStreetsLoading || streets.length === 1 || !domainId || edit
          }
          dropdownStyle={dropdownStyle}
          allowClear
          showSearch
          onChange={(value) => {
            const selected = options.find((option) => option.value === value)
            onStreetHasServiceChange(selected?.hasService || false)
          }}
        />
      </Form.Item>
    </Tooltip>
  )
}

export default AddressesSelect
