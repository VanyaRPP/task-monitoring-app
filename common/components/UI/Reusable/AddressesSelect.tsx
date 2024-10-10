import { validateField } from '@assets/features/validators'
import { useGetAllStreetsQuery } from '@common/api/streetApi/street.api'
import { Form, FormInstance, Select, Tooltip } from 'antd'
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
      // Якщо адрес одна, обираємо її, навіть якщо немає сервісу
      if (options.length === 1) {
        form.setFieldsValue({ street: options[0].value })
        onStreetHasServiceChange?.(options[0].hasService)
      } else {
        // Знаходимо першу адресу з сервісом, якщо така є
        const firstStreetWithService = options.find(
          (option) => option.hasService
        )

        if (firstStreetWithService) {
          form.setFieldsValue({ street: firstStreetWithService.value })
          onStreetHasServiceChange?.(firstStreetWithService.hasService)
        } else {
          // Якщо сервісу немає, скидаємо вибрану адресу
          form.setFieldsValue({ street: undefined })
          onStreetHasServiceChange?.(false)
        }
      }
    }
  }, [domainId, options, form, onStreetHasServiceChange])

  const selectedStreet = options.find((option) => option.value === streetId)
  const showTooltip = selectedStreet && !selectedStreet.hasService

  return (
    <Tooltip
      title="Послуг за даною адресою не знайдено! Будь ласка, оберіть іншу адресу або додайте нову послугу за цією адресою"
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
            onStreetHasServiceChange?.(selected?.hasService || false)
          }}
        />
      </Form.Item>
    </Tooltip>
  )
}

export default AddressesSelect
