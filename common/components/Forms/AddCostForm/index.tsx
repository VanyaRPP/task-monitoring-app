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
  Select,
} from 'antd'
import ukUA from 'antd/lib/locale/uk_UA'
import dayjs from 'dayjs'
import 'dayjs/locale/uk'
import { useTranslation } from 'next-i18next'
import s from './style.module.scss'
import { formatDateWithGenitiveMonthCapitalized } from '@utils/helpers'

dayjs.locale('uk')

interface Props {
  form: FormInstance<any>
  type: string
  disabled?: boolean
  currentProfit?: Profit
}

const AddCostForm: React.FC<Props> = ({
  form,
  type,
  disabled,
  currentProfit,
}) => {
  const { t } = useTranslation()
  const isPreview = !!disabled
  const isDebit = currentProfit?.type === 'debit'
  const isCredit = currentProfit?.type === 'credit'
  return (
    <ConfigProvider locale={ukUA}>
      <Form form={form} layout="vertical" className={s.Form}>
        {isPreview && (
          <div className={s.createdByWrapper}>
            {currentProfit?.createdBy ? (
              <Form.Item label={t('profitPage:form.createdBy')}>
                <div>
                  <span className={s.createdByName}>
                    {currentProfit.createdBy.name}
                  </span>
                  <br />
                  <span className={s.createdByEmail}>
                    {currentProfit.createdBy.email}
                  </span>
                </div>
              </Form.Item>
            ) : (
              <Form.Item
                style={{ marginBottom: 2 }}
                label={
                  <>
                    {t('profitPage:form.createdBy')}
                    <span className={s.createdByNameAutomatic}>
                      {t('profitPage:form.automatic')}
                    </span>
                  </>
                }
              />
            )}
          </div>
        )}

        <DomainsSelect
          form={form}
          disabled={isPreview}
          currentProfit={currentProfit}
        />

        <Form.Item
          name="date"
          label={t('profitPage:form.date')}
          rules={!disabled && !currentProfit ? validateField('required') : []}
        >
          <DatePicker
            format={(date) =>
              date ? formatDateWithGenitiveMonthCapitalized(date) : ''
            }
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
            rules={!disabled && !currentProfit ? validateField('required') : []}
          >
            <InputNumber
              parser={inputNumberParser}
              placeholder={t('profitPage:form.amountPlaceholder')}
              className={s.formInput}
              disabled={disabled}
            />
          </Form.Item>
        )}

        <Form.Item name="description" label={t('profitPage:form.description')}>
          <Input.TextArea
            placeholder={t('profitPage:form.descriptionPlaceholder')}
            maxLength={256}
            className={s.formInput}
            disabled={disabled}
          />
        </Form.Item>
        <Form.Item name="categories" label={t('profitPage:form.category')}>
          {isPreview ? (
            <Input
              value={
                currentProfit?.categories?.length
                  ? currentProfit.categories.join(', ')
                  : 'Без категорії'
              }
              disabled
              className={s.formInput}
            />
          ) : (
            <Select
              mode="tags"
              tokenSeparators={[',']}
              placeholder="Оберіть або введіть категорії"
              disabled={disabled}
              className={s.formInput}
            />
          )}
        </Form.Item>
      </Form>
    </ConfigProvider>
  )
}

export default AddCostForm
