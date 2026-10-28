import { Alert, Empty, InputNumber, Select, Space, Typography } from 'antd'
import { formatPeriod } from '@utils/debt-calculation/months'
import { useDebtCalculationContext } from './'
import DebtActSummary from './ActSummary'
import MonthsTable from './MonthsTable'
import s from './style.module.scss'

const DebtCalculationBody: React.FC = () => {
  const {
    domainId,
    companyId,
    company,
    result,
    overrides,
    openingDebtPrefill,
    setApartmentOverride,
  } = useDebtCalculationContext()

  if (!domainId) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="Оберіть домен у фільтрі згори"
      />
    )
  }

  if (!companyId || !result) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="Оберіть компанію, щоб побачити розрахунок"
      />
    )
  }

  const param = (
    label: string,
    field:
      'area' | 'tariff' | 'openingDebt' | 'charged' | 'paid' | 'correction',
    placeholder: string,
    hint?: string
  ) => (
    <label className={s.Field} title={hint}>
      <span className={s.Label}>{label}</span>
      <InputNumber
        // A correction lowers the debt when negative.
        min={field === 'correction' ? undefined : 0}
        value={overrides[field]}
        placeholder={placeholder}
        onChange={(value) =>
          setApartmentOverride({
            [field]: value == null ? undefined : Number(value),
          })
        }
      />
    </label>
  )

  const EVERY_MONTH =
    'Одне значення на кожен місяць, де немає ні ручної правки, ні даних з платежів. Свої значення місяця мають перевагу.'

  const fromPhoto = result.rows.filter(
    (row) => overrides.months?.[formatPeriod(row)]?.source === 'photo'
  ).length

  // `TableCard` gives its body padding: 0 while the card head keeps its own
  // 24px, so the gutter is set here - otherwise the content hangs to the left
  // of the heading.
  return (
    <div className={s.Body}>
      <div className={s.Section}>
        <div className={s.Apartment}>
          <Typography.Text strong>{company?.companyName}</Typography.Text>
          {company?.description && (
            <Typography.Text type="secondary" className={s.Muted}>
              {company.description}
            </Typography.Text>
          )}
        </div>

        <Space wrap size="middle">
          {param('Площа, м²', 'area', String(company?.totalArea ?? 0))}
          {param(
            'Тариф, грн/м²',
            'tariff',
            String(company?.pricePerMeter ?? 0)
          )}
          {/* Imported history («Вхідне сальдо» + months before the period)
              fills this in; typing a value still overrides it. */}
          {param(
            'Борг на початок періоду',
            'openingDebt',
            (openingDebtPrefill ?? 0).toFixed(2)
          )}
        </Space>

        <Space wrap size="middle" className={s.EveryMonth}>
          {param(
            'Нараховано щомісяця',
            'charged',
            'за площею й тарифом',
            EVERY_MONTH
          )}
          {param('Сплачено щомісяця', 'paid', '0.00', EVERY_MONTH)}
          {param('Коректура щомісяця', 'correction', '0.00', EVERY_MONTH)}
          <label
            className={s.Field}
            title="З якого числа першого місяця періоду йде борг: з 10 числа — 22 дні замість 31. Нараховано за цей місяць (якщо не введене вручну) і річні рахуються лише за ці дні."
          >
            <span className={s.Label}>Перший місяць — з числа</span>
            <Select
              value={overrides.startDay}
              onChange={(value) =>
                setApartmentOverride({ startDay: value ?? undefined })
              }
              options={Array.from({ length: 31 }, (_, index) => ({
                value: index + 1,
                label: String(index + 1),
              }))}
              placeholder="1"
              allowClear
              className={s.StartDay}
              aria-label="Перший місяць — з числа"
            />
          </label>
        </Space>
      </div>

      {fromPhoto > 0 && (
        <Alert
          type="info"
          showIcon
          message={`З фото заповнено місяців: ${fromPhoto}`}
          description="Перевірте позначені місяці й виправте, де треба, — правка знімає позначку. Коли все зійдеться з папером, натисніть «Створити платежі»."
        />
      )}

      <MonthsTable result={result} />

      <div className={s.Section}>
        <DebtActSummary result={result} />
      </div>
    </div>
  )
}

export default DebtCalculationBody
