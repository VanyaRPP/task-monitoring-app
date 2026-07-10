import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { validateField } from '@assets/features/validators'
import DomainsSelect from '@components/UI/Reusable/DomainsSelect'
import { Profit } from '@common/api/profitsApi/profits.type'
import { inputNumberParser } from '@utils/helpers'
import {
  Button,
  ConfigProvider,
  DatePicker,
  Form,
  FormInstance,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
} from 'antd'
import ukUA from 'antd/lib/locale/uk_UA'
import dayjs from 'dayjs'
import 'dayjs/locale/uk'
import { useTranslation } from 'next-i18next'
import s from './style.module.scss'
import { formatDateWithGenitiveMonthCapitalized } from '@utils/helpers'
import { useMemo, useState } from 'react'

dayjs.locale('uk')

interface Props {
  form: FormInstance<any>
  type: string
  disabled?: boolean
  currentProfit?: Profit
}

const DEFAULT_CATEGORIES = [
  'Оренда',
  'Електрика',
  'Вода',
  'Обслуговування',
  'Прибирання',
  'Майстри',
  'Матеріали',
  'Кава-чай',
]

const OTHER_KEY = '__other__'

interface CategoriesFieldProps {
  value?: string[]
  onChange?: (value: string[]) => void
  disabled?: boolean
}

interface CategoryRow {
  key: string
  value: string
  index: number
  editing?: boolean
}

const CategoriesField: React.FC<CategoriesFieldProps> = ({
  value,
  onChange,
  disabled,
}) => {
  const categories = useMemo(() => value ?? [], [value])

  const [extraCategories, setExtraCategories] = useState<string[]>([])
  const [showOtherInput, setShowOtherInput] = useState(false)
  const [otherValue, setOtherValue] = useState('')

  const allCategories = useMemo(
    () => Array.from(new Set([...DEFAULT_CATEGORIES, ...extraCategories])),
    [extraCategories]
  )

  const options = useMemo(
    () => [
      ...allCategories
        .filter((c) => !categories.includes(c))
        .map((c) => ({ value: c, label: c })),
      { value: OTHER_KEY, label: 'Інше' },
    ],
    [allCategories, categories]
  )

  const handleSelect = (val: string) => {
    if (val === OTHER_KEY) {
      setShowOtherInput(true)
      return
    }
    if (!categories.includes(val)) {
      onChange?.([...categories, val])
    }
  }

  const handleRemove = (index: number) => {
    onChange?.(categories.filter((_, i) => i !== index))
  }

  const handleAddOther = () => {
    const val = otherValue.trim()
    if (!val) return

    if (!allCategories.includes(val)) {
      setExtraCategories((prev) => [...prev, val])
    }
    if (!categories.includes(val)) {
      onChange?.([...categories, val])
    }

    setOtherValue('')
    setShowOtherInput(false)
  }

  const handleCancelOther = () => {
    setOtherValue('')
    setShowOtherInput(false)
  }

  const rows: CategoryRow[] = [
    ...categories.map((c, index) => ({ key: `cat-${index}`, value: c, index })),
    ...(showOtherInput
      ? [{ key: '__other_input__', value: '', index: -1, editing: true }]
      : []),
  ]

  const columns = [
    {
      title: 'Категорії',
      render: (_: unknown, row: CategoryRow) =>
        row.editing ? (
          <Input
            autoFocus
            size="small"
            value={otherValue}
            disabled={disabled}
            placeholder="Введіть свою категорію"
            onChange={(e) => setOtherValue(e.target.value)}
            onPressEnter={handleAddOther}
          />
        ) : (
          row.value
        ),
    },
    {
      width: 120,
      render: (_: unknown, row: CategoryRow) =>
        row.editing ? (
          <Space size={8}>
            <Button type="primary" size="small" onClick={handleAddOther}>
              Додати
            </Button>
            <MinusCircleOutlined onClick={handleCancelOther} />
          </Space>
        ) : (
          <MinusCircleOutlined
            onClick={() => !disabled && handleRemove(row.index)}
            style={{ opacity: disabled ? 0.5 : 1 }}
          />
        ),
    },
  ]

  return (
    <>
      {rows.length > 0 && (
        <Table
          rowKey="key"
          size="small"
          showHeader={false}
          pagination={false}
          dataSource={rows}
          columns={columns}
          style={{ marginBottom: 8 }}
        />
      )}
      <Select
        style={{ width: '100%' }}
        suffixIcon={<PlusOutlined />}
        placeholder="Додати категорію..."
        value={undefined}
        options={options}
        onSelect={handleSelect}
        disabled={disabled}
        showSearch
        optionFilterProp="label"
      />
    </>
  )
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
            <CategoriesField disabled={disabled} />
          )}
        </Form.Item>
      </Form>
    </ConfigProvider>
  )
}

export default AddCostForm
