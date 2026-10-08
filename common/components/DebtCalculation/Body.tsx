import { Alert, Empty, InputNumber, Space, Typography } from 'antd'
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
    field: 'area' | 'tariff' | 'openingDebt',
    placeholder: string
  ) => (
    <label className={s.Field}>
      <span className={s.Label}>{label}</span>
      <InputNumber
        min={0}
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
