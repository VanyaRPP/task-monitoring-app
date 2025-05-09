import { validateField } from '@assets/features/validators'
import {
  useGetCitiesAutocompleteQuery,
  useSearchStreetsQuery,
} from '@common/api/streetApi/street.api'
import useDebounce from '@modules/hooks/useDebounce'
import { AutoComplete, Form, FormInstance } from 'antd'
import { FC, useEffect, useState } from 'react'
import s from './style.module.scss'

interface Props {
  form: FormInstance<any>
  editable?: boolean
  setIsValueChanged: (value: boolean) => void
}

const AddStreetForm: FC<Props> = ({ form, editable, setIsValueChanged }) => {
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [addressOptions, setAddressOptions] = useState<{ value: string }[]>([])

  const debouncedCity = useDebounce(city, 300)
  const debouncedAddress = useDebounce(address, 300)

  const { data: cityOptions = [] } = useGetCitiesAutocompleteQuery(
    debouncedCity,
    { skip: !debouncedCity }
  )

  const { data: streets } = useSearchStreetsQuery(
    { city: debouncedCity, address: debouncedAddress },
    { skip: !debouncedCity || !debouncedAddress }
  )

  useEffect(() => {
    if (streets?.data?.length) {
      setAddressOptions(
        streets.data.map((street: any) => ({
          value: street.address,
        }))
      )
    } else {
      setAddressOptions([])
    }
  }, [streets])

  return (
    <Form
      form={form}
      layout="vertical"
      className={s.Form}
      onValuesChange={() => setIsValueChanged(true)}
    >
      <Form.Item
        required
        name="city"
        label="Місто"
        rules={validateField('city')}
      >
        <AutoComplete
          options={cityOptions.map((c) => ({ value: c }))}
          placeholder="Введіть місто"
          value={city}
          onChange={(val) => {
            setCity(val)
            setIsValueChanged(true)
            setAddress('') // clear address if city changed
            form.setFieldsValue({ address: '' })
          }}
          disabled={!editable}
        />
      </Form.Item>
      <Form.Item
        required
        name="address"
        label="Адреса"
        rules={validateField('address')}
      >
        <AutoComplete
          options={addressOptions}
          placeholder="Введіть адресу"
          value={address}
          onChange={(val) => {
            setAddress(val)
            setIsValueChanged(true)
          }}
          onSelect={(val) => {
            form.setFieldsValue({ address: val })
            setIsValueChanged(true)
          }}
          disabled={!editable || !city}
        />
      </Form.Item>
    </Form>
  )
}

export default AddStreetForm
