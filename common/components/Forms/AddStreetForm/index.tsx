import { validateField } from '@assets/features/validators'
import { Form, FormInstance, Input, AutoComplete} from 'antd'
import {FC, useEffect, useState} from 'react'
import s from './style.module.scss'
import {useSearchStreetsQuery} from "@common/api/streetApi/street.api";
import useDebounce from "@modules/hooks/useDebounce";

interface Props {
  form: FormInstance<any>
  editable?: boolean
  setIsValueChanged: (value: boolean) => void
}

const AddStreetForm: FC<Props> = ({ form, editable, setIsValueChanged }) => {
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [options, setOptions] = useState<{ value: string }[]>([]);

  const debouncedCity = useDebounce(city, 500);
  const debouncedAddress = useDebounce(address, 500);

  const { data: streets, isLoading } = useSearchStreetsQuery(
    { city: debouncedCity, address: debouncedAddress },
    { skip: !debouncedCity || !debouncedAddress }
  );

  useEffect(() => {
    if (streets && streets.data.length > 0) {
      setOptions(
        streets.data.map((street: any) => ({
          value: street.address,
        }))
      );
    } else {
      setOptions([]);
    }
  }, [streets]);

  const handleCityChange = (value: string) => {
    setCity(value);
    setIsValueChanged(true);
  };

  const handleAddressChange = (value: string) => {
    setAddress(value);
    setIsValueChanged(true);
  };

  const handleAddressSelect = (value: string) => {
    form.setFieldsValue({ address: value });
    setIsValueChanged(true);
  };
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
        <Input
          placeholder="Введіть місто"
          maxLength={256}
          className={s.formInput}
          disabled={!editable}
          value={city}
          onChange={(e) => handleCityChange(e.target.value)}
        />
      </Form.Item>
      <Form.Item
        required
        name="address"
        label="Адреса"
        rules={validateField('address')}
      >
        <AutoComplete
          options={options}
          placeholder="Введіть адресу"
          value={address}
          onSelect={handleAddressSelect}
          onSearch={handleAddressChange}
          disabled={!editable}
        />
      </Form.Item>
    </Form>
  )
}

export default AddStreetForm
