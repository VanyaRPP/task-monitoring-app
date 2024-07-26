import { IService } from '@common/api/serviceApi/service.api.types'
import { validateField } from '@common/assets/features/validators'
import AddressesSelect from '@common/components/UI/Reusable/AddressesSelect'
import DomainsSelect from '@common/components/UI/Reusable/DomainsSelect'
import useInitialValues from '@common/modules/hooks/useInitialValues'
import { DatePicker, Form, FormInstance, Input, InputNumber } from 'antd'
import { useEffect } from 'react'
import s from './style.module.scss'
import dayjs from 'dayjs'
import { usePreviousMonthService } from '@common/modules/hooks/useService'

interface Props {
  form: FormInstance<any>
  edit: boolean
  currentService: IService
}

const AddServiceForm: React.FC<Props> = ({ form, edit, currentService }) => {
  const { MonthPicker } = DatePicker
  const initialValues = useInitialValues(currentService)
  console.log(currentService)

  useEffect(() => {
    if (currentService) {
      form.setFieldsValue(initialValues)
    }
  }, [currentService, form, initialValues])

  const serviceData = {
    domain: currentService?.domain?._id?.toString(),
    street: currentService?.street?._id?.toString(),
  }

  const date = Form.useWatch('date', form)

  const { previousMonth } = usePreviousMonthService({
    date,
    domainId: serviceData.domain,
    streetId: serviceData.street,
  })

  useEffect(() => {
    if (!previousMonth) {
      form.setFieldsValue({
        rentPrice: 0,
        electricityPrice: 0,
        waterPrice: 0,
        waterPriceTotal: 0,
        garbageCollectorPrice: 0,
        inflicionPrice: 0,
      })
      return
    }
    const {
      rentPrice,
      electricityPrice,
      waterPrice,
      waterPriceTotal,
      garbageCollectorPrice,
      inflicionPrice,
    } = previousMonth
    form.setFieldsValue({
      rentPrice,
      electricityPrice,
      waterPrice,
      waterPriceTotal,
      garbageCollectorPrice,
      inflicionPrice,
    })
  }, [previousMonth, form])

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
      <Form.Item name="description" label="Опис">
        <Input.TextArea
          placeholder="Введіть опис"
          autoSize={{ minRows: 2, maxRows: 5 }}
          maxLength={256}
          className={s.formInput}
        />
      </Form.Item>
    </Form>
  )
}

export default AddServiceForm
