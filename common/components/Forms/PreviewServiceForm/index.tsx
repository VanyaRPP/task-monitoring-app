import { IService } from '@common/api/serviceApi/service.api.types'
import useInitialValues from '@modules/hooks/useInitialValues'
import { DatePicker, Form, FormInstance, Input } from 'antd'
import { FC } from 'react'
import s from './style.module.scss'

interface Props {
  form: FormInstance<any>
  currentService: IService
}

const PreviewServiceForm: FC<Props> = ({ form, currentService }) => {
  const { MonthPicker } = DatePicker
  const initialValues = useInitialValues(currentService)

  return (
    <Form
      initialValues={initialValues}
      form={form}
      layout="vertical"
      className={s.Form}
    >
      <Form.Item name="domain" label="Надавач послуг">
        <Input disabled />
      </Form.Item>
      <Form.Item name="street" label="Адреса">
        <Input disabled />
      </Form.Item>
      <Form.Item name="date" label="Місяць та рік">
        <MonthPicker format="MMMM YYYY" className={s.formInput} disabled />
      </Form.Item>
      <Form.Item name="rentPrice" label="Утримання приміщень (грн/м²)">
        <Input className={s.formInput} disabled />
      </Form.Item>
      <Form.Item name="electricityPrice" label="Електроенергія (грн/кВт)">
        <Input className={s.formInput} disabled />
      </Form.Item>
      <Form.Item name="waterPrice" label="Водопостачання (грн/м³)">
        <Input className={s.formInput} disabled />
      </Form.Item>
      <Form.Item name="waterPriceTotal" label="Всього водопостачання">
        <Input className={s.formInput} disabled />
      </Form.Item>
      <Form.Item name="garbageCollectorPrice" label="Вивіз сміття">
        <Input className={s.formInput} disabled />
      </Form.Item>
      <Form.Item name="inflicionPrice" label="Індекс інфляції">
        <Input className={s.formInput} disabled />
      </Form.Item>
      <Form.Item name="description" label="Опис">
        <Input.TextArea
          autoSize={{ minRows: 2, maxRows: 5 }}
          maxLength={256}
          className={s.formInput}
          disabled
        />
      </Form.Item>
    </Form>
  )
}

export default PreviewServiceForm
