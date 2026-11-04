import { InputNumber, Select, Tooltip } from 'antd'
import type { ChangeField } from '@utils/debt-calculation/changes'
import { useDebtCalculationContext } from './'
import ValueChanges from './ValueChanges'
import s from './style.module.scss'

/**
 * The company-wide values, each in the table header right above the column it
 * fills: «Тариф» over the tariffs of the months, «Сплачено щомісяця» over the
 * payments. A month's own figure still wins over them.
 */

export const EVERY_MONTH_HINT =
  'Значення для всіх місяців: стоїть над колонкою, яку заповнює. Цифра, введена в самому місяці або взята з платежів, має перевагу. «+ зміна» — інше значення з якогось місяця далі.'

interface IGeneralInputProps {
  field: ChangeField | 'openingDebt'
  /** Accessible name; also the title of its changes. */
  label: string
  placeholder: string
}

export const GeneralInput: React.FC<IGeneralInputProps> = ({
  field,
  label,
  placeholder,
}) => {
  const { overrides, setApartmentOverride } = useDebtCalculationContext()

  return (
    <div className={s.General}>
      <InputNumber
        size="small"
        // A correction lowers the debt when negative.
        min={field === 'correction' ? undefined : 0}
        value={overrides[field]}
        placeholder={placeholder}
        aria-label={label}
        className={s.GeneralInput}
        onChange={(value) =>
          setApartmentOverride({
            [field]: value == null ? undefined : Number(value),
          })
        }
      />
      {field !== 'openingDebt' && (
        <ValueChanges field={field} label={label} placeholder={placeholder} />
      )}
    </div>
  )
}

const START_DAY_HINT =
  'З якого числа першого місяця періоду йде борг: з 10 числа — 22 дні замість 31. Нараховано за цей місяць (якщо не введене вручну) і річні рахуються лише за ці дні.'

export const StartDaySelect: React.FC = () => {
  const { overrides, setApartmentOverride } = useDebtCalculationContext()

  return (
    <Tooltip title={START_DAY_HINT}>
      <div className={s.General}>
        <Select
          size="small"
          value={overrides.startDay}
          onChange={(value) =>
            setApartmentOverride({ startDay: value ?? undefined })
          }
          options={Array.from({ length: 31 }, (_, index) => ({
            value: index + 1,
            label: String(index + 1),
          }))}
          placeholder="з 1"
          allowClear
          className={s.GeneralInput}
          aria-label="Перший місяць — з числа"
        />
        <span className={s.GeneralNote}>з числа</span>
      </div>
    </Tooltip>
  )
}
