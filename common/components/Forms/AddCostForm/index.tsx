import { validateField } from '@assets/features/validators'
import DomainsSelect from '@components/UI/Reusable/DomainsSelect'
import { Profit } from '@common/api/profitsApi/profits.type'
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
import { useTranslation } from 'next-i18next'
import s from './style.module.scss'

dayjs.locale('uk')

interface Props {
  form: FormInstance<any>
  type: string
  disabled?: boolean
  currentProfit?: Profit 
}

const AddCostForm: React.FC<Props> = ({ form, type, disabled, currentProfit }) => {
  const { t } = useTranslation()
  const isPreview = !!disabled
  const isDebit = currentProfit?.type === 'debit'
  const isCredit = currentProfit?.type === 'credit'
  return (
    <ConfigProvider locale={ukUA}>
      <Form form={form} layout="vertical" className={s.Form}>
        {(isPreview || currentProfit && currentProfit.createdBy) && (
            <div className={s.createdByWrapper}>
              <Form.Item label={t('profitPage:form.createdBy')}>
                <div>
                  <span className={s.createdByName}>
                    {currentProfit?.createdBy?.name}
                  </span>
                  <br />
                  <span className={s.createdByEmail}>
                    {currentProfit?.createdBy?.email}
                  </span>
                </div>
              </Form.Item>
            </div>
          )}

        <DomainsSelect form={form} disabled={isPreview} currentProfit={currentProfit}/>

        <Form.Item
          name="date"
          label={t('profitPage:form.date')}
          rules={(!disabled && !currentProfit) ? validateField('required') : []}
        >
          <DatePicker
            format="MMMM YYYY DD"
            placeholder={t('profitPage:form.datePlaceholder', { ns: 'common' })}
            className={s.formInput}
            disabled={isPreview}
          />
        </Form.Item>
       {isPreview ? (
          <Form.Item
            name="sum"
            label={
              isDebit
                ? t('profitPage:form.amountDebit')
                : isCredit
                ? t('profitPage:form.amountCredit')
                : t('profitPage:form.amount')
            }
          >
            <Input
              value={currentProfit?.amount}
              disabled
              className={s.formInput}
            />
          </Form.Item>
        ) : (
          <Form.Item
            name="sum"
            label={
              type === 'debit'
                ? t('profitPage:form.amountDebit')
                : t('profitPage:form.amountCredit')
            }
            rules={(!disabled && !currentProfit) ? validateField('required') : []}
          >
            <InputNumber
              parser={inputNumberParser}
              placeholder={t('profitPage:form.amountPlaceholder')}
              className={s.formInput}
              disabled={disabled}
            />
          </Form.Item>
        )}

        <Form.Item
          name="description"
          label={t('profitPage:form.description')}
        >
          <Input.TextArea
            placeholder={t('profitPage:form.descriptionPlaceholder')}
            maxLength={256}
            className={s.formInput}
            disabled={disabled}
          />
        </Form.Item>
        {isPreview && (
          <Form.Item name="categories" label={t('profitPage:form.category')}>
            <Input
              value={currentProfit?.categories?.join(', ')}
              disabled
              className={s.formInput}
            />
          </Form.Item>
        )}
      </Form>
    </ConfigProvider>
  )
}

export default AddCostForm
