import { validateField } from '@assets/features/validators'
import DomainsSelect from '@components/UI/Reusable/DomainsSelect'
import { inputNumberParser } from '@utils/helpers'
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
import s from './style.module.scss'
import { useEffect } from 'react'

dayjs.locale('uk')

interface Props {
  form: FormInstance<any>
  disabled?: boolean
  currentCost?: {
    domain: string
    date: Date
    sum: number
    description: string
  }
  type: string
}

const AddCostForm: React.FC<Props> = ({ form, type, disabled, currentCost }) => {
  const { MonthPicker } = DatePicker

   useEffect(() => {
    if (currentCost) {
      form.setFieldsValue({
        domain: currentCost.domain,
        date: currentCost.date ? dayjs(currentCost.date) : null,
        sum: currentCost.sum,
        description: currentCost.description,
      })
    }
  }, [currentCost, form])

  return (
    <ConfigProvider locale={ukUA}>
      <Form 
        form={form} 
        layout="vertical" 
        className={s.Form}   
        disabled={disabled}
        requiredMark={!disabled}>
        <DomainsSelect form={form} disabled={disabled} />
        <Form.Item
          name="date"
          label="Місяць та рік"
          rules={validateField('required')}
        >
          <MonthPicker
            format="MMMM YYYY"
            placeholder="Оберіть місяць"
            className={s.formInput}
            disabled={disabled}
          />
        </Form.Item>
        <Form.Item
          name="sum"
          label={type === 'debit' ? 'Витрати' : 'Прибутки'}
          rules={validateField('required')}
        >
          <InputNumber
            parser={inputNumberParser}
            placeholder="Вкажіть значення"
            className={s.formInput}
            disabled={disabled}
          />
        </Form.Item>
        <Form.Item name="description" label="Опис">
          <Input.TextArea
            placeholder="Введіть опис"
            maxLength={256}
            className={s.formInput}
            disabled={disabled}
          />
        </Form.Item>
      </Form>
    </ConfigProvider>
  )
}

export default AddCostForm
