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
import { useTranslation } from 'react-i18next'
import s from './style.module.scss'

dayjs.locale('uk')

interface Props {
  form: FormInstance<any>
  type: string
}

const AddCostForm: React.FC<Props> = ({ form, type }) => {
  const { t } = useTranslation('profitPage')

  return (
    <ConfigProvider locale={ukUA}>
      <Form form={form} layout="vertical" className={s.Form}>
        <DomainsSelect form={form} />
        <Form.Item
          name="date"
          label={t('form.date')}
          rules={validateField('required')}
        >
          <DatePicker
            format="MMMM YYYY DD"
            placeholder={t('form.datePlaceholder')}
            className={s.formInput}
          />
        </Form.Item>
        <Form.Item
          name="sum"
          label={
            type === 'debit' ? t('form.amountDebit') : t('form.amountCredit')
          }
          rules={validateField('required')}
        >
          <InputNumber
            parser={inputNumberParser}
            placeholder={t('form.amountPlaceholder')}
            className={s.formInput}
          />
        </Form.Item>
        <Form.Item name="description" label={t('form.description')}>
          <Input.TextArea
            placeholder={t('form.descriptionPlaceholder')}
            maxLength={256}
            className={s.formInput}
          />
        </Form.Item>
      </Form>
    </ConfigProvider>
  )
}

export default AddCostForm
