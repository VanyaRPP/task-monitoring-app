import { validateField } from '@assets/features/validators'
import { useGetAllStreetsQuery } from '@common/api/streetApi/street.api'
import { AppRoutes } from '@utils/constants'
import {
  Button,
  Divider,
  Form,
  FormInstance,
  Input,
  Select,
  Tooltip,
} from 'antd'
import Link from 'next/link'
import { CSSProperties, useEffect, useMemo, useState } from 'react'
import { useAddStreetMutation } from '@common/api/streetApi/street.api'
import { PlusOutlined } from '@ant-design/icons'
import { isNewEntityValue } from '@utils/inlineCreate'

export interface AddressesSelectProps {
  form: FormInstance
  edit?: boolean
  create?: boolean
  dropdownStyle?: CSSProperties
  street?: string
  required?: boolean
  onStreetHasServiceChange?: (hasService: boolean) => void
}

const AddressesSelect: React.FC<AddressesSelectProps> = ({
  form,
  edit,
  dropdownStyle,
  street,
  required = true,
  onStreetHasServiceChange,
}) => {
  const streetId: string = Form.useWatch('street', form)
  const domainId: string = Form.useWatch('domain', form)

  const {
    data: streets = [],
    isLoading: isStreetsLoading,
    isError: isStreetsError,
  } = useGetAllStreetsQuery(
    { domainId },
    { skip: !domainId || isNewEntityValue(domainId) }
  )
  const [search, setSearch] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [newAddress, setNewAddress] = useState('')
  const [newCity, setNewCity] = useState('')
  const [addStreet] = useAddStreetMutation()
  const options = useMemo(() => {
    return streets.map((i) => ({
      value: i._id,
      label: `${i.address} (м. ${i.city})`,
      hasService: i.hasService,
    }))
  }, [streets])

  useEffect(() => {
    // Form.useWatch reports `undefined` for a field's very first render
    // (it only catches up to the real store value a tick later, via its
    // own effect). Reading the store directly here — instead of trusting
    // the `domainId`/`streetId` watch snapshots — avoids treating that
    // transient "not caught up yet" state as "no domain/street selected"
    // and wiping out a value the modal already populated for editing.
    const liveDomainId = form.getFieldValue('domain')

    if (!liveDomainId) {
      form.setFieldsValue({ street: undefined })
      onStreetHasServiceChange?.(false)
      return
    }

    // The street list for this domain hasn't loaded yet. Don't touch the
    // field while we don't know the valid options — clearing here would
    // wipe out an edit-mode value before we ever get a chance to confirm
    // it's still valid (see the edit-mode check below), letting the
    // "auto-pick a street" branch silently replace it with the wrong
    // address once the list finally arrives.
    if (isStreetsLoading) return

    if (options.length === 0) {
      form.setFieldsValue({ street: undefined })
      onStreetHasServiceChange?.(false)
      return
    }

    // In edit mode the entity already carries its own street. If that value
    // is still a valid option for this domain, keep it instead of forcing an
    // auto-pick below — otherwise every edit would silently overwrite the
    // company's real address with "the first street that has a service".
    const liveStreetId = form.getFieldValue('street')
    const currentStreet = options.find(
      (option) => option.value === liveStreetId
    )
    if (edit && currentStreet) {
      onStreetHasServiceChange?.(currentStreet.hasService)
      return
    }

    if (options.length === 1) {
      form.setFieldsValue({ street: options[0].value })
      onStreetHasServiceChange?.(options[0].hasService)
      return
    }

    const firstStreetWithService = options.find((option) => option.hasService)

    if (firstStreetWithService) {
      street
        ? form.setFieldsValue({ street: street })
        : form.setFieldsValue({ street: firstStreetWithService.value })
      onStreetHasServiceChange?.(firstStreetWithService.hasService)
    } else {
      form.setFieldsValue({ street: undefined })
      onStreetHasServiceChange?.(false)
    }
  }, [
    domainId,
    options,
    form,
    street,
    onStreetHasServiceChange,
    edit,
    streetId,
    isStreetsLoading,
  ])

  const selectedStreet = options.find((option) => option.value === streetId)
  const showNoServiceTooltip = !!selectedStreet && !selectedStreet.hasService
  const showNoAddressesTooltip =
    required && !!domainId && !isStreetsLoading && options.length === 0
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
  const enterCreateMode = () => {
    setIsCreating(true)
    setNewAddress(search.trim())
    setNewCity('')
    setSearch('')
  }

  const exitCreateMode = () => {
    setIsCreating(false)
    setNewAddress('')
    setNewCity('')
  }
  if (isCreating) {
    return (
      <Form.Item
        name="street"
        label="Адреса"
        tooltip="Об'єкт (адреса), за яким нараховується оплата."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Input
            placeholder="Адреса"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            autoFocus
          />
          <Input
            placeholder="Місто"
            value={newCity}
            onChange={(e) => setNewCity(e.target.value)}
          />

          <div style={{ display: 'flex', gap: 4 }}>
            <Button
              type="primary"
              size="small"
              block
              onClick={async () => {
                if (!newAddress.trim() || !newCity.trim()) return
                try {
                  const result = await addStreet({
                    address: newAddress.trim(),
                    city: newCity.trim(),
                    domain: domainId,
                  } as any).unwrap()
                  const newId = (result as any).data?._id ?? (result as any)._id
                  form.setFieldValue('street', newId)
                  exitCreateMode()
                  setTimeout(() => {
                    form.setFieldValue('street', newId)
                  }, 300)
                } catch {
                  exitCreateMode()
                }
              }}
            >
              Зберегти
            </Button>
            <Button size="small" block onClick={exitCreateMode}>
              ← обрати наявну
            </Button>
          </div>
        </div>
      </Form.Item>
    )
  }

  return (
    <Tooltip
      title={tooltipContent}
      visible={showNoAddressesTooltip || showNoServiceTooltip}
      placement="top"
    >
      <Form.Item
        name="street"
        label="Адреса"
        tooltip="Об'єкт (адреса), за яким нараховується оплата. Необов'язково."
        rules={required ? validateField('required') : []}
      >
        <Select
          options={options}
          optionFilterProp="label"
          placeholder="Пошук адреси"
          status={isStreetsError && 'error'}
          loading={isStreetsLoading}
          disabled={isStreetsLoading || !domainId}
          dropdownStyle={dropdownStyle}
          allowClear
          showSearch
          searchValue={search}
          onSearch={setSearch}
          onChange={(value) => {
            const selected = options.find((option) => option.value === value)
            onStreetHasServiceChange?.(selected?.hasService || false)
            setSearch('')
          }}
          popupRender={(menu) => (
            <>
              {menu}
              <Divider style={{ margin: '8px 0' }} />
              <Button
                type="text"
                block
                icon={<PlusOutlined />}
                style={{ textAlign: 'left' }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={enterCreateMode}
              >
                {search.trim()
                  ? `Створити «${search.trim()}»`
                  : 'Створити нову вулицю'}
              </Button>
            </>
          )}
        />
      </Form.Item>
    </Tooltip>
  )
}

export default AddressesSelect
