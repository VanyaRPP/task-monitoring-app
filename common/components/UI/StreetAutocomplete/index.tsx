import { useSearchStreetsQuery } from '@common/api/streetApi/street.api'
import useDebounce from '@modules/hooks/useDebounce'
import { AutoComplete, Form } from 'antd'
import { FC } from 'react'

interface Props {
  city: string
  setCity: (v: string) => void
  setIsValueChanged: (v: boolean) => void
  editable?: boolean
  form: any
}

const StreetAutocomplete: FC<Props> = ({
  city,
  setCity,
  setIsValueChanged,
  editable,
  form,
}) => {
  const address = Form.useWatch('address', form)
  const debouncedCity = useDebounce(city, 300)
  const debouncedAddress = useDebounce(address, 300)

  const { data, isFetching } = useSearchStreetsQuery(
    { city: debouncedCity, address: debouncedAddress },
    { skip: !debouncedCity || !debouncedAddress }
  )

  const options =
    data?.data?.map((item: any) => ({
      value: `${item.city}, ${item.address}`,
      label: `${item.city}, ${item.address}`,
    })) || []

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <AutoComplete
        style={{ width: 160 }}
        placeholder="Місто"
        disabled={!editable}
        value={city}
        onSearch={(value) => {
          setCity(value)
          setIsValueChanged(true)
        }}
      />
      <AutoComplete
        style={{ width: 260 }}
        placeholder="Адреса"
        disabled={!editable}
        value={address}
        options={options}
        onSearch={(value) => {
          form.setFieldValue('address', value)
          setIsValueChanged(true)
        }}
        onSelect={(value, option) => {
          form.setFieldValue('address', value)
          form.setFieldValue('city', (option.label as string)?.split(',')[0]?.trim())
          setIsValueChanged(true)
        }}
        notFoundContent={isFetching ? 'Loading...' : null}
      />
    </div>
  )
}

export default StreetAutocomplete
