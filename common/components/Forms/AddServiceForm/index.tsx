import { validateField } from '@assets/features/validators'
import { IService } from '@common/api/serviceApi/service.api.types'
import AddressesSelect from '@components/UI/Reusable/AddressesSelect'
import DomainsSelect from '@components/UI/Reusable/DomainsSelect'
import { usePreviousMonthService } from '@modules/hooks/useService'
import {
  ConfigProvider,
  DatePicker,
  Form,
  FormInstance,
  Input,
  InputNumber,
} from 'antd'
import ukUA from 'antd/lib/locale/uk_UA'
import dayjs from 'dayjs'
import 'dayjs/locale/uk'
import { useEffect } from 'react'
import s from './style.module.scss'

dayjs.locale('uk')

interface Props {
  form: FormInstance<any>
  edit: boolean
  currentService: IService
  setIsValueChanged: (value: boolean) => void
}

const AddServiceForm: React.FC<Props> = ({
  form,
  edit,
  currentService,
  setIsValueChanged,
}) => {
  const { MonthPicker } = DatePicker

  const date = Form.useWatch('date', form)
  const domainId = Form.useWatch('domain', form)
  const streetId = Form.useWatch('street', form)

  const { previousMonth } = usePreviousMonthService({
    date,
    domainId,
    streetId,
  })

  useEffect(() => {
    form.setFieldsValue({
      electricityPrice:
        currentService?.electricityPrice ??
        previousMonth?.electricityPrice ??
        0,
      inflicionPrice:
        currentService?.inflicionPrice ?? previousMonth?.inflicionPrice ?? 0,
      rentPrice: currentService?.rentPrice ?? previousMonth?.rentPrice ?? 0,
      waterPrice: currentService?.waterPrice ?? previousMonth?.waterPrice ?? 0,
      waterPriceTotal:
        currentService?.waterPriceTotal ?? previousMonth?.waterPriceTotal ?? 0,
      garbageCollectorPrice:
        currentService?.garbageCollectorPrice ??
        previousMonth?.garbageCollectorPrice ??
        0,
    })
  }, [form, currentService, previousMonth])

  return (
    <ConfigProvider locale={ukUA}>
      <Form
        form={form}
        layout="vertical"
        className={s.Form}
        initialValues={{
          domain: currentService?.domain?._id,
          street: currentService?.street?._id,
          date: dayjs(currentService?.date),
          description: currentService?.description,
        }}
        onValuesChange={() => setIsValueChanged(true)}
      >
        <DomainsSelect form={form} edit={edit} />
        <AddressesSelect form={form} edit={edit} />
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
            autoSize={{
              minRows: 2,
              maxRows: 5,
            }}
            maxLength={256}
            className={s.formInput}
          />
        </Form.Item>
      </Form>
    </ConfigProvider>
  )
}

export default AddServiceForm
