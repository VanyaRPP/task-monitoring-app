import React, { FC, useState, useEffect } from 'react'
import { validateField } from '@common/assets/features/validators'
import { Select, Form, FormInstance, Input, InputNumber } from 'antd'
import s from './style.module.scss'
import { useGetAllRealEstateQuery } from 'common/api/realestateApi/realestate.api'
interface Props {
  form: any
}

const RealEstateForm: FC<Props> = ({ form }) => {
  const companyName = form.getFieldValue('companyName')
  const { data: realEstates, isLoading } = useGetAllRealEstateQuery({
    limit: 5,
  })
  const [companyNameTest, setCompanyName] = useState('')
  const [matchingObject, setMatchingObject] = useState(null)

  useEffect(() => {
    const foundObject = realEstates.find(
      (obj) => obj.companyName === companyNameTest
    )

    if (foundObject) {
      setMatchingObject(foundObject)
    } else {
      setMatchingObject(null)
    }
  }, [companyNameTest, realEstates])

  // Rest of the component code...

  return (
    <Form form={form} layout="vertical" className={s.Form}>
      <Form.Item label="Domain">
        <Input
          name="domain"
          disabled={true} // Set disabled to true to close the field from changes
          value={matchingObject?.domain?.name || ''}
        />
      </Form.Item>
      <Form.Item label="Address">
        <Input
          name="address"
          disabled={true} // Set disabled to true to close the field from changes
          value={matchingObject?.street?.address || ''}
        />
      </Form.Item>
      <Form.Item
        name="companyName"
        label="Назва компанії"
        rules={validateField('required')}
      >
        <Input
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Опис"
          maxLength={256}
          className={s.formInput}
        />
      </Form.Item>
      <Form.Item
        name="bankInformation"
        label="Банківська інформація"
        rules={validateField('required')}
      >
        <Input placeholder="Опис" maxLength={256} className={s.formInput} />
      </Form.Item>
      <Form.Item
        name="agreement"
        label="Договір"
        rules={validateField('required')}
      >
        <Input placeholder="Опис" maxLength={256} className={s.formInput} />
      </Form.Item>
      <Form.Item name="phone" label="Телефон" rules={validateField('phone')}>
        <Input placeholder="Опис" maxLength={256} className={s.formInput} />
      </Form.Item>
      {/* TODO: validation */}
      <Form.Item
        name="adminEmails"
        label="Адміністратори"
        rules={validateField('required')}
      >
        <Select mode="tags" placeholder="Пошти адмінів компанії" />
      </Form.Item>
      <Form.Item
        name="totalArea"
        label="Кількість метрів"
        rules={validateField('required')}
      >
        <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
      </Form.Item>
      <Form.Item
        name="pricePerMeter"
        label="Ціна за метр"
        rules={validateField('required')}
      >
        <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
      </Form.Item>
      <Form.Item
        name="servicePricePerMeter"
        label="Індивідуальне утримання за метр"
      >
        <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
      </Form.Item>
      <Form.Item name="garbageCollector" label="Вивіз сміття">
        <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
      </Form.Item>
    </Form>
  )
}

export default RealEstateForm
