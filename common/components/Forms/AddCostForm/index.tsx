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

dayjs.locale('uk')

interface Props {
  form: FormInstance<any>
  type: string
}

const AddCostForm: React.FC<Props> = ({ form, type }) => {
  return (
    <ConfigProvider locale={ukUA}>
      <Form form={form} layout="vertical" className={s.Form}>
        <DomainsSelect form={form} />
        <Form.Item name="date" label="Data" rules={validateField('required')}>
          <DatePicker
            format="MMMM YYYY DD"
            placeholder="Date"
            className={s.formInput}
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
          />
        </Form.Item>
        <Form.Item name="description" label="Опис">
          <Input.TextArea
            placeholder="Введіть опис"
            maxLength={256}
            className={s.formInput}
          />
        </Form.Item>
      </Form>
    </ConfigProvider>
  )
}

export default AddCostForm
