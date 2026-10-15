import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { validateField } from '@assets/features/validators'
import DomainsSelect from '@components/UI/Reusable/DomainsSelect'
import ProfitScopeSelect from './ProfitScopeSelect'
import type { ActiveScope } from '@components/AddCostModal'
import { Profit } from '@common/api/profitsApi/profits.type'
import { inputNumberParser } from '@utils/helpers'
import {
  Alert,
  AutoComplete,
  Button,
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
import { CURRENCY_SELECT_OPTIONS } from '@utils/constants'
import {
  PROFIT_DEFAULT_CATEGORIES,
  PROFIT_ITEM_CATEGORY_MAX,
  PROFIT_ITEM_DESCRIPTION_MAX,
  sumProfitItems,
} from '@utils/profit-items'

dayjs.locale('uk')

interface Props {
  form: FormInstance<any>
  type: string
  disabled?: boolean
  currentProfit?: Profit
  /** Set when opened from a scoped ledger - see ActiveScope's own doc. */
  activeScope?: ActiveScope
  /** Pick the target among every domain and company (an AI draft). */
  pickScope?: boolean
}

const CATEGORY_OPTIONS = PROFIT_DEFAULT_CATEGORIES.map((value) => ({ value }))

const formatTotal = (value: number) =>
  value.toLocaleString('uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

interface ItemsFieldProps {
  disabled?: boolean
  totalLabel: string
}

/**
 * One receipt as lines: a category (a standard one, or any name typed in -
 * the «Інше» case), its amount and a note. The record's amount is their sum,
 * shown here and recomputed by the API on save.
 */
const ItemsField: React.FC<ItemsFieldProps> = ({ disabled, totalLabel }) => {
  const { t } = useTranslation()

  return (
    <>
      <Form.List
        name="items"
        rules={[
          {
            validator: async (_, items) => {
              if (!items?.length) {
                throw new Error(t('profitPage:form.itemsRequired'))
              }
            },
          },
        ]}
      >
        {(fields, { add, remove }, { errors }) => (
          <div className={s.items}>
            {fields.map(({ key, name }) => (
              <div key={key} className={s.itemRow}>
                <Form.Item name={[name, 'category']} className={s.itemCategory}>
                  <AutoComplete
                    options={CATEGORY_OPTIONS}
                    filterOption={(input, option) =>
                      String(option?.value)
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    maxLength={PROFIT_ITEM_CATEGORY_MAX}
                    placeholder={t('profitPage:form.itemCategoryPlaceholder')}
                    disabled={disabled}
                  />
                </Form.Item>
                <Form.Item
                  name={[name, 'amount']}
                  className={s.itemAmount}
                  rules={[
                    {
                      validator: async (_, value) => {
                        if (!(Number(value) > 0)) {
                          throw new Error(
                            t('profitPage:form.itemAmountRequired')
                          )
                        }
                      },
                    },
                  ]}
                >
                  <InputNumber
                    parser={inputNumberParser}
                    min={0.01}
                    placeholder={t('profitPage:form.amountPlaceholder')}
                    className={s.formInput}
                    disabled={disabled}
                  />
                </Form.Item>
                <Form.Item
                  name={[name, 'description']}
                  className={s.itemDescription}
                >
                  <Input
                    maxLength={PROFIT_ITEM_DESCRIPTION_MAX}
                    placeholder={t(
                      'profitPage:form.itemDescriptionPlaceholder'
                    )}
                    disabled={disabled}
                  />
                </Form.Item>
                {!disabled && (
                  <Button
                    type="text"
                    icon={<MinusCircleOutlined />}
                    aria-label={t('profitPage:form.removeItem')}
                    onClick={() => remove(name)}
                  />
                )}
              </div>
            ))}
            {!disabled && (
              <Button
                type="dashed"
                block
                icon={<PlusOutlined />}
                onClick={() => add({})}
              >
                {t('profitPage:form.addItem')}
              </Button>
            )}
            <Form.ErrorList errors={errors} />
          </div>
        )}
      </Form.List>

      <Form.Item noStyle shouldUpdate>
        {({ getFieldValue }) => (
          <div className={s.itemsTotal}>
            {totalLabel}:{' '}
            <b>{formatTotal(sumProfitItems(getFieldValue('items') ?? []))}</b>
          </div>
        )}
      </Form.Item>
    </>
  )
}

const AddCostForm: React.FC<Props> = ({
  form,
  type,
  disabled,
  currentProfit,
  activeScope,
  pickScope,
}) => {
  const { t } = useTranslation()

  const isPreview = !!disabled
  const recordType = currentProfit?.type ?? type
  const amountLabel =
    recordType === 'debit'
      ? t('profitPage:form.amountDebit')
      : recordType === 'credit'
        ? t('profitPage:form.amountCredit')
        : t('profitPage:form.amount')
  const hasItems = !!currentProfit?.items?.length
  const isLegacyPreview = isPreview && !!currentProfit && !hasItems
  // Editing an older multi-category record: its single amount can't be split
  // for the user, so the lines come without amounts and this says why.
  const needsSplit =
    !isPreview &&
    !!currentProfit &&
    !hasItems &&
    (currentProfit.categories?.length ?? 0) > 1

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

        {activeScope ? (
          // The target is implied by the ledger this modal was opened from -
          // shown, not picked. Domain and company render identically here;
          // only the label differs (see ActiveScope).
          <Form.Item
            label={
              activeScope.type === 'domain'
                ? t('profitPage:form.domainScope')
                : t('profitPage:form.companyScope')
            }
          >
            <Input value={activeScope.label} disabled />
          </Form.Item>
        ) : pickScope ? (
          <ProfitScopeSelect form={form} disabled={isPreview} />
        ) : (
          <DomainsSelect
            form={form}
            disabled={isPreview}
            currentProfit={currentProfit}
          />
        )}

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

        {/*
          Which month the cost belongs to, which is often not the month it was
          paid in - June utilities are usually settled in July. The profit
          ledger groups on this, so it has to be stated rather than inferred.
        */}
        <Form.Item
          name="periodMonth"
          label={t('profitPage:form.periodMonth')}
          tooltip={t('profitPage:form.periodMonthHint')}
        >
          <DatePicker
            picker="month"
            format="MMMM YYYY"
            placeholder={t('profitPage:form.periodMonthPlaceholder')}
            className={s.formInput}
            disabled={isPreview}
          />
        </Form.Item>

        {isLegacyPreview ? (
          // Records from before line items: one amount, categories apart.
          <>
            <Form.Item name="sum" label={amountLabel}>
              <Input
                value={currentProfit?.amount}
                disabled
                className={s.formInput}
              />
            </Form.Item>
            <Form.Item label={t('profitPage:form.category')}>
              <Input
                value={
                  currentProfit?.categories?.length
                    ? currentProfit.categories.join(', ')
                    : t('profitPage:dashboard.uncategorized')
                }
                disabled
                className={s.formInput}
              />
            </Form.Item>
          </>
        ) : (
          <Form.Item label={t('profitPage:form.items')} required={!isPreview}>
            {needsSplit && (
              <Alert
                type="warning"
                showIcon
                className={s.itemsAlert}
                message={t('profitPage:form.splitLegacy', {
                  amount: formatTotal(currentProfit.amount),
                })}
              />
            )}
            <ItemsField disabled={isPreview} totalLabel={amountLabel} />
          </Form.Item>
        )}

        {/*
          A domain that invoices in USD also pays some costs in USD; without
          this the expense side could only ever be UAH.
        */}
        <Form.Item name="currency" label={t('profitPage:form.currency')}>
          <Select
            options={CURRENCY_SELECT_OPTIONS}
            className={s.formInput}
            disabled={isPreview}
          />
        </Form.Item>

        <Form.Item name="description" label={t('profitPage:form.description')}>
          <Input.TextArea
            placeholder={t('profitPage:form.descriptionPlaceholder')}
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
