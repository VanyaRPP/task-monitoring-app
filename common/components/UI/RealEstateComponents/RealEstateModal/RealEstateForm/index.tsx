import React, { FC } from 'react'
import { validateField } from '@common/assets/features/validators'
import { Select, Form, FormInstance, Input, InputNumber, Checkbox } from 'antd'
import AddressesSelect from '../../../Reusable/AddressesSelect'
import DomainsSelect from '../../../Reusable/DomainsSelect'
import s from './style.module.scss'
import EmailSelect from '@common/components/UI/Reusable/EmailSelect'
import { IExtendedRealestate } from '@common/api/realestateApi/realestate.api.types'

interface Props {
  form: FormInstance<any>
  currentRealEstate: IExtendedRealestate
}

const RealEstateForm: FC<Props> = ({ form, currentRealEstate }) => {
  const initialValues = useInitialValues(currentRealEstate)

  return (
    <Form
      form={form}
      layout="vertical"
      className={s.Form}
      initialValues={initialValues}
    >
      {currentRealEstate ? (
        <Form.Item name="domain" label="Надавач послуг">
          <Input disabled />
        </Form.Item>
      ) : (
        <DomainsSelect form={form} />
      )}
      {currentRealEstate ? (
        <Form.Item name="street" label="Адреса">
          <Input disabled />
        </Form.Item>
      ) : (
        <AddressesSelect form={form} />
      )}
      <Form.Item
        name="companyName"
        label="Назва компанії"
        rules={validateField('required')}
      >
        <Input placeholder="Опис" maxLength={256} className={s.formInput} />
      </Form.Item>
      <Form.Item
        name="description"
        label="Опис"
        rules={validateField('required')}
      >
        <Input.TextArea
          rows={4}
          placeholder="Опис"
          maxLength={512}
          className={s.formInput}
        />
      </Form.Item>
      <EmailSelect form={form} />
      <Form.Item
        name="totalArea"
        label="Площа (м²)"
        rules={validateField('required')}
      >
        <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
      </Form.Item>
      <Form.Item
        name="pricePerMeter"
        label="Ціна (грн/м²)"
        rules={validateField('required')}
      >
        <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
      </Form.Item>
      <Form.Item
        name="servicePricePerMeter"
        label="Індивідуальне утримання (грн/м²)"
      >
        <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
      </Form.Item>
      <Form.Item name="rentPart" label="Частка загальної площі">
        <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
      </Form.Item>
      <Form.Item name="waterPart" label="Частка водопостачання">
        <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
      </Form.Item>
      <Form.Item name="cleaning" label="Прибирання (грн)">
        <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
      </Form.Item>
      <Form.Item name="discount" label="Знижка">
        <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
      </Form.Item>
      <Form.Item
        valuePropName="checked"
        name="garbageCollector"
        label="Вивіз сміття"
      >
        <Checkbox />
      </Form.Item>
      <Form.Item
        valuePropName="checked"
        name="inflicion"
        label="Індекс інфляції"
      >
        <Checkbox />
      </Form.Item>
    </Form>
  )
}

function useInitialValues(currentRealEstate) {
  // TODO: add useEffect || useCallback ?
  // currently we have few renders
  // we need it only once. on didmount (first render)
  const initialValues = {
    domain: currentRealEstate?.domain?.name,
    street:
      currentRealEstate?.street &&
      `${currentRealEstate.street.address} (м. ${currentRealEstate.street.city})`,
    companyName: currentRealEstate?.companyName,
    description: currentRealEstate?.description,
    adminEmails: currentRealEstate?.adminEmails,
    pricePerMeter: currentRealEstate?.pricePerMeter,
    servicePricePerMeter: currentRealEstate?.servicePricePerMeter,
    totalArea: currentRealEstate?.totalArea,
    garbageCollector: currentRealEstate?.garbageCollector,
    rentPart: currentRealEstate?.rentPart,
    inflicion: currentRealEstate?.inflicion,
    waterPart: currentRealEstate?.waterPart,
    discount: currentRealEstate?.discount,
    cleaning: currentRealEstate?.cleaning,
  }
  return initialValues
}

export default RealEstateForm
