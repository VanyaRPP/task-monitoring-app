import React, { FC, useEffect } from 'react'
import { validateField } from '@common/assets/features/validators'
import { Form, FormInstance, Input, InputNumber } from 'antd'
import { DatePicker } from 'antd'
import s from './style.module.scss'
import AddressesSelect from '@common/components/UI/Reusable/AddressesSelect'
import DomainsSelect from '@common/components/UI/Reusable/DomainsSelect'
import { IExtendedService } from '@common/api/serviceApi/service.api.types'
import moment from 'moment'

interface Props {
  form: FormInstance<any>
  edit: boolean
  currentService: IExtendedService
}

const AddServiceForm: FC<Props> = ({ form, edit, currentService }) => {
  const { MonthPicker } = DatePicker
  const initialValues = useInitialValues(currentService)

  return (
    <Form
      initialValues={initialValues}
      form={form}
      layout="vertical"
      className={s.Form}
    >
      {edit ? (
        <Form.Item name="domain" label="Надавач послуг">
          <Input disabled />
        </Form.Item>
      ) : (
        <DomainsSelect form={form} />
      )}
      {edit ? (
        <Form.Item name="street" label="Адреса">
          <Input disabled />
        </Form.Item>
      ) : (
        <AddressesSelect form={form} />
      )}
      <Form.Item
        name="date"
        label="Місяць та рік"
        rules={validateField('required')}
      >
        <MonthPicker
          format="MMMM YYYY"
          placeholder="Оберіть місяць"
          className={s.formInput}
        />
      </Form.Item>
      <Form.Item
        name="rentPrice"
        label="Утримання приміщень (грн/м²)"
        rules={validateField('required')}
      >
        <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
      </Form.Item>
      <Form.Item
        name="electricityPrice"
        label="Електроенергія (грн/кВт)"
        rules={validateField('electricityPrice')}
      >
        <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
      </Form.Item>
      <Form.Item
        name="waterPrice"
        label="Водопостачання (грн/м³)"
        rules={validateField('required')}
      >
        <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
      </Form.Item>
      <Form.Item
        name="waterPriceTotal"
        label="Всього водопостачання (грн/м³)"
        rules={validateField('required')}
      >
        <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
      </Form.Item>
      <Form.Item name="garbageCollectorPrice" label="Вивіз сміття">
        <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
      </Form.Item>
      <Form.Item name="inflicionPrice" label="Індекс інфляції">
        <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
      </Form.Item>
      <Form.Item name="publicElectricUtilityPrice" label="Нарахування МЗК">
        <InputNumber placeholder="Вкажіть значення" className={s.formInput} />
      </Form.Item>
      <Form.Item name="description" label="Опис">
        <Input.TextArea
          placeholder="Введіть опис"
          maxLength={256}
          className={s.textArea}
        />
      </Form.Item>
    </Form>
  )
}

function useInitialValues(currentService) {
  // TODO: add useEffect || useCallback ?
  // currently we have few renders
  // we need it only once. on didmount (first render)
  const initialValues = {
    domain: currentService?.domain?.name,
    street:
      currentService?.street &&
      `${currentService.street.address} (м. ${currentService.street.city})`,
    date: moment(currentService?.date),
    electricityPrice: currentService?.electricityPrice,
    inflicionPrice: currentService?.inflicionPrice,
    rentPrice: currentService?.rentPrice,
    waterPrice: currentService?.waterPrice,
    description: currentService?.description,
    waterPriceTotal: currentService?.waterPriceTotal,
    garbageCollectorPrice: currentService?.garbageCollectorPrice,
    publicElectricUtilityPrice: currentService?.publicElectricUtilityPrice,

  }
  return initialValues
}

export default AddServiceForm
