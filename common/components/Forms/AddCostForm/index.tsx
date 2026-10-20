import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { validateField } from '@assets/features/validators'
import DomainsSelect from '@components/UI/Reusable/DomainsSelect'
import ProfitScopeSelect from './ProfitScopeSelect'
import type { ActiveScope } from '@components/AddCostModal'
import { Profit } from '@common/api/profitsApi/profits.type'
import { useMemo, useState } from 'react'
import cn from 'classnames'
import { getCurrencySymbol, inputNumberParser } from '@utils/helpers'
import {
  Alert,
  AutoComplete,
  Button,
  Collapse,
  ConfigProvider,
  DatePicker,
  Form,
  FormInstance,
  Input,
  InputNumber,
  Segmented,
  Select,
  Space,
  Typography,
} from 'antd'
import ukUA from 'antd/lib/locale/uk_UA'
import dayjs from 'dayjs'
import 'dayjs/locale/uk'
import { useTranslation } from 'next-i18next'
import s from './style.module.scss'
import { formatDateWithGenitiveMonthCapitalized } from '@utils/helpers'
import { CURRENCY_SELECT_OPTIONS } from '@utils/constants'
import {
  groupProfitByCategory,
  normalizeCategoryKey,
} from '@utils/profit-categories'
import {
  PROFIT_DEFAULT_CATEGORIES,
  PROFIT_ITEM_CATEGORY_MAX,
  PROFIT_ITEM_DESCRIPTION_MAX,
  itemsForEditing,
  type IProfitItem,
  sumProfitItems,
} from '@utils/profit-items'

dayjs.locale('uk')

interface Props {
  form: FormInstance<any>
  type: string
  disabled?: boolean
  currentProfit?: Profit
  /** Line to show on its own; the rest sit behind a toggle. */
  focusItemIndex?: number
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

// Below this a receipt reads fine as one flat list; grouping is for the long ones.
const GROUP_MIN_ITEMS = 6
const NEW_BUCKET = '__new'

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 8,
  width: '100%',
}

interface BucketHeaderProps {
  label: string
  count: number
  total: number
  currency?: string
}

const BucketHeader: React.FC<BucketHeaderProps> = ({
  label,
  count,
  total,
  currency,
}) => (
  <span style={headerStyle}>
    <Typography.Text strong ellipsis style={{ flex: 1, minWidth: 0 }}>
      {label}
    </Typography.Text>
    <Typography.Text type="secondary">{count}</Typography.Text>
    <Typography.Text strong style={{ fontVariantNumeric: 'tabular-nums' }}>
      {getCurrencySymbol(currency)} {formatTotal(total)}
    </Typography.Text>
  </span>
)

interface ItemsFieldProps {
  disabled?: boolean
  totalLabel: string
  /** The saved lines being edited; a long receipt is grouped by their categories. */
  initialItems?: Partial<IProfitItem>[]
  /** Fold the saved lines into category blocks (long receipts only). */
  grouped?: boolean
  /** Line the modal was opened from: its category opens, the rest stay shut. */
  focusIndex?: number
}

/**
 * One receipt as lines: a category (a standard one, or any name typed in -
 * the «Інше» case), its amount and a note. The record's amount is their sum,
 * shown here and recomputed by the API on save.
 *
 * A long saved receipt is grouped into collapsible category blocks (the same
 * grouping the ledger table shows). The grouping is a snapshot of the saved
 * lines - re-grouping live would make a row jump away while its category is
 * being typed.
 */
const ItemsField: React.FC<ItemsFieldProps> = ({
  disabled,
  totalLabel,
  initialItems,
  grouped,
  focusIndex,
}) => {
  const { t } = useTranslation()
  const form = Form.useFormInstance()
  const watched: Partial<IProfitItem>[] = Form.useWatch('items', form) ?? []
  const currency: string | undefined = Form.useWatch('currency', form)
  const uncategorized = t('profitPage:dashboard.uncategorized')

  // Form.List hands out field keys 0..n-1, in order, when the saved lines
  // load and never reuses one - so a key still identifies its saved line
  // after others are removed. Keys beyond n are lines added in this session.
  const buckets = useMemo(() => {
    if (!grouped || !initialItems) return null
    const byKey = new Map<
      string,
      { key: string; label: string; keys: number[]; total: number }
    >()
    initialItems.forEach((item, index) => {
      const label = item.category?.trim() || uncategorized
      const key = normalizeCategoryKey(label)
      const bucket = byKey.get(key) ?? { key, label, keys: [], total: 0 }
      bucket.keys.push(index)
      bucket.total += Number(item.amount) || 0
      byKey.set(key, bucket)
    })
    return Array.from(byKey.values()).sort((a, b) => b.total - a.total)
  }, [grouped, initialItems, uncategorized])

  const [openKeys, setOpenKeys] = useState<string[]>(() => {
    const focused = initialItems?.[focusIndex]
    return focused
      ? [normalizeCategoryKey(focused.category?.trim() || uncategorized)]
      : []
  })

  // A line that fails validation inside a folded block would leave the error
  // out of sight, so the block holding it is opened.
  const reveal = (fieldKey: number) => {
    if (!buckets) return
    const bucket =
      buckets.find((b) => b.keys.includes(fieldKey))?.key ?? NEW_BUCKET
    setOpenKeys((keys) => (keys.includes(bucket) ? keys : [...keys, bucket]))
  }

  const renderRow = (
    { key, name }: { key: number; name: number },
    remove: (index: number) => void
  ) => (
    <div key={key} className={s.itemRow}>
      <Form.Item name={[name, 'category']} className={s.itemCategory}>
        <AutoComplete
          options={CATEGORY_OPTIONS}
          filterOption={(input, option) =>
            String(option?.value).toLowerCase().includes(input.toLowerCase())
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
                reveal(key)
                throw new Error(t('profitPage:form.itemAmountRequired'))
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
      <Form.Item name={[name, 'description']} className={s.itemDescription}>
        <Input
          maxLength={PROFIT_ITEM_DESCRIPTION_MAX}
          placeholder={t('profitPage:form.itemDescriptionPlaceholder')}
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
  )

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
        {(fields, { add, remove }, { errors }) => {
          const sumOf = (list: typeof fields) =>
            sumProfitItems(
              list.map(({ name }) => ({
                amount: Number(watched[name]?.amount) || 0,
              }))
            )
          const savedKeys = new Set(buckets?.flatMap((b) => b.keys))
          const added = fields.filter(({ key }) => !savedKeys.has(key))

          const panels = buckets
            ? [
                ...buckets.map((bucket) => ({
                  key: bucket.key,
                  label: bucket.label,
                  fields: fields.filter(({ key }) => bucket.keys.includes(key)),
                })),
                {
                  key: NEW_BUCKET,
                  label: t('profitPage:form.newItems'),
                  fields: added,
                },
              ].filter((panel) => panel.fields.length > 0)
            : null

          return (
            <div className={s.items}>
              {panels ? (
                <Collapse
                  size="small"
                  activeKey={openKeys}
                  onChange={(keys) => setOpenKeys([].concat(keys))}
                  items={panels.map((panel) => ({
                    key: panel.key,
                    // Keeps collapsed rows registered, so saving still
                    // validates a line the user edited and then folded away.
                    forceRender: true,
                    label: (
                      <BucketHeader
                        label={panel.label}
                        count={panel.fields.length}
                        total={sumOf(panel.fields)}
                        currency={currency}
                      />
                    ),
                    children: (
                      <div className={s.items}>
                        {panel.fields.map((field) => renderRow(field, remove))}
                      </div>
                    ),
                  }))}
                />
              ) : (
                fields.map((field) => renderRow(field, remove))
              )}
              {!disabled && (
                <Button
                  type="dashed"
                  block
                  icon={<PlusOutlined />}
                  onClick={() => {
                    add({})
                    if (panels) {
                      setOpenKeys((keys) =>
                        keys.includes(NEW_BUCKET) ? keys : [...keys, NEW_BUCKET]
                      )
                    }
                  }}
                >
                  {t('profitPage:form.addItem')}
                </Button>
              )}
              <Form.ErrorList errors={errors} />
            </div>
          )
        }}
      </Form.List>

      <div className={s.itemsTotal}>
        {totalLabel}:{' '}
        <b>{formatTotal(sumProfitItems(watched as IProfitItem[]))}</b>
      </div>
    </>
  )
}

interface ItemsPreviewProps {
  items: IProfitItem[]
  grouped: boolean
  currency?: string
  focusIndex?: number
  totalLabel: string
}

/**
 * Read-only view of a receipt: text, not a wall of disabled inputs. Short
 * receipts are a flat list, biggest first; long ones fold into categories,
 * with the one the modal was opened from already open and its line marked.
 */
const ItemsPreview: React.FC<ItemsPreviewProps> = ({
  items,
  grouped,
  currency,
  focusIndex,
  totalLabel,
}) => {
  const { t } = useTranslation()
  const uncategorized = t('profitPage:dashboard.uncategorized')
  const total = sumProfitItems(items)

  const groups = useMemo(
    () =>
      groupProfitByCategory(
        [{ amount: total, items, currency }],
        uncategorized
      ),
    [items, total, currency, uncategorized]
  )

  const renderLine = (
    line: { itemIndex?: number; description?: string; amount: number },
    category?: string
  ) => (
    <div
      key={line.itemIndex}
      className={cn(s.previewLine, {
        [s.previewFocus]: line.itemIndex === focusIndex,
      })}
    >
      {category !== undefined && (
        <Typography.Text ellipsis>{category}</Typography.Text>
      )}
      <Typography.Text
        type="secondary"
        ellipsis={{ tooltip: line.description }}
      >
        {line.description || '—'}
      </Typography.Text>
      <span className={s.previewAmount}>
        {getCurrencySymbol(currency)} {formatTotal(line.amount)}
      </span>
    </div>
  )

  const focusedGroup = groups.find((group) =>
    group.lines.some((line) => line.itemIndex === focusIndex)
  )

  return (
    <>
      {grouped ? (
        <Collapse
          size="small"
          defaultActiveKey={focusedGroup ? [focusedGroup.key] : []}
          items={groups.map((group) => ({
            key: group.key,
            label: (
              <BucketHeader
                label={group.category}
                count={group.lines.length}
                total={group.total}
                currency={group.currency}
              />
            ),
            children: (
              <div className={s.previewLines}>
                {group.lines.map((line) => renderLine(line))}
              </div>
            ),
          }))}
        />
      ) : (
        <div className={s.previewLines}>
          {groups
            .flatMap((group) =>
              group.lines.map((line) => ({ line, category: group.category }))
            )
            .sort((a, b) => b.line.amount - a.line.amount)
            .map(({ line, category }) => renderLine(line, category))}
        </div>
      )}
      <div className={s.itemsTotal}>
        {totalLabel}: <b>{formatTotal(total)}</b>
      </div>
    </>
  )
}

const AddCostForm: React.FC<Props> = ({
  form,
  type,
  disabled,
  currentProfit,
  focusItemIndex,
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
  const savedItems = useMemo(
    () => (currentProfit ? itemsForEditing(currentProfit) : undefined),
    [currentProfit]
  )
  // Only a long receipt is worth folding; the switch appears for those alone.
  const isLongReceipt =
    (isPreview
      ? currentProfit?.items?.length
      : currentProfit && savedItems?.length) >= GROUP_MIN_ITEMS
  const [itemsView, setItemsView] = useState<'groups' | 'flat'>('groups')
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
          <Form.Item
            className={s.itemsLabel}
            label={
              <div className={s.itemsLabelRow}>
                <span>{t('profitPage:form.items')}</span>
                {isLongReceipt && (
                  <Segmented
                    size="small"
                    value={itemsView}
                    onChange={(value) =>
                      setItemsView(value as 'groups' | 'flat')
                    }
                    options={[
                      {
                        label: t('profitPage:form.itemsViewGroups'),
                        value: 'groups',
                      },
                      {
                        label: t('profitPage:form.itemsViewFlat'),
                        value: 'flat',
                      },
                    ]}
                  />
                )}
              </div>
            }
            required={!isPreview}
          >
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
            {isPreview ? (
              <ItemsPreview
                items={currentProfit.items}
                grouped={isLongReceipt && itemsView === 'groups'}
                currency={currentProfit.currency}
                focusIndex={focusItemIndex}
                totalLabel={amountLabel}
              />
            ) : (
              <ItemsField
                totalLabel={amountLabel}
                initialItems={savedItems}
                grouped={isLongReceipt && itemsView === 'groups'}
                focusIndex={focusItemIndex}
              />
            )}
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
