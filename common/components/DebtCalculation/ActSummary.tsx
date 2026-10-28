import { IDebtCalculationResult } from '@utils/debt-calculation/types'
import { InputNumber } from 'antd'
import { Dayjs } from 'dayjs'
import { Fragment } from 'react'
import { useDebtCalculationContext } from './'
import { formatMoney } from './format'
import s from './style.module.scss'

/**
 * The debt is stated as of the first day of the month FOLLOWING the end of
 * the period: a period through June 2025 means debt as of 01.07.2025.
 */
export const asOfDate = (to?: Dayjs): string =>
  to ? to.add(1, 'month').startOf('month').format('DD.MM.YYYY') : '—'

const DebtActSummary: React.FC<{ result: IDebtCalculationResult }> = ({
  result,
}) => {
  const { to, annualRatePercent, overrides, setApartmentOverride } =
    useDebtCalculationContext()

  const amounts: { label: string; value: number }[] = [
    { label: 'внесок', value: result.body },
    { label: `${annualRatePercent}% річних`, value: result.interest },
    { label: 'Інфляційні витрати', value: result.inflation },
  ]

  const inputs: { label: string; field: 'legalFees' | 'courtFee' }[] = [
    { label: 'Юридичні послуги', field: 'legalFees' },
    { label: 'Держмито', field: 'courtFee' },
  ]

  // One grid for the whole block: otherwise the amount column drifts between
  // the total row and the breakdown, because the breakdown has an extra
  // leading column.
  return (
    <div className={s.Act}>
      <span className={s.ActTotalLabel}>
        Заборгованість станом на {asOfDate(to)} року
      </span>
      <span className={s.ActTotalValue}>{formatMoney(result.total)}</span>
      <span className={s.ActUnit}>грн</span>
      <span className={s.ActDivider} />

      <span className={s.ActPrefix}>в т.ч.</span>
      {amounts.map(({ label, value }, index) => (
        <Fragment key={label}>
          {index > 0 && <span className={s.ActSpacer} />}
          <span className={s.ActLabel}>{label}</span>
          <span className={s.ActValue}>{formatMoney(value)}</span>
          <span className={s.ActUnit}>грн</span>
        </Fragment>
      ))}

      {inputs.map(({ label, field }) => (
        <Fragment key={field}>
          <span className={s.ActSpacer} />
          <span className={s.ActLabel}>{label}</span>
          <span className={s.ActValue}>
            <InputNumber
              size="small"
              min={0}
              className={s.ActInput}
              value={overrides[field]}
              placeholder="0.00"
              aria-label={label}
              onChange={(value) =>
                setApartmentOverride({
                  [field]: value == null ? undefined : Number(value),
                })
              }
            />
          </span>
          <span className={s.ActUnit}>грн</span>
        </Fragment>
      ))}

      <span className={s.ActSignLabel}>Голова правління</span>
      <span className={s.ActSignLine} />
    </div>
  )
}

export default DebtActSummary
