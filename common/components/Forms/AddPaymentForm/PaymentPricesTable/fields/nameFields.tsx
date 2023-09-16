import {
  maintenanceWithoutInflicionDescription,
  inflicionDescription,
} from '@utils/constants'
import StyledTooltip from '@common/components/UI/Reusable/StyledTooltip'
import { usePreviousMonthService } from '@common/modules/hooks/useService'
import { usePaymentContext } from '@common/components/AddPaymentModal'
import { InflicionIndexTitle } from '@utils/inflicion'
import { Form } from 'antd'
import s from '../style.module.scss'

export function NamePlacingField({ dateMonth, nameRes, company }) {
  return (
    <span className={s.rowText}>
      Розміщення <div className={s.month}>{dateMonth}</div>
      {!!company?.inflicion && (
        <span className={s.rowText}>
          <span className={s.month}>без врахування індексу інфляції </span>
          <StyledTooltip title={maintenanceWithoutInflicionDescription} />
        </span>
      )}
    </span>
  )
}
export function NameMaintainceField({ dateMonth, company }) {
  return (
    <span className={s.rowText}>
      Утримання <div className={s.month}>{dateMonth}</div>
      {!!company?.servicePricePerMeter && (
        <span className={s.month}> індивідуальне</span>
      )}
    </span>
  )
}
export function NameElectricityField({ dateMonth }) {
  return (
    <span className={s.rowText}>
      Електропостачання <div className={s.month}>{dateMonth}</div>
    </span>
  )
}
export function NameWaterField({ dateMonth }) {
  return (
    <span className={s.rowText}>
      Водопостачання <div className={s.month}>{dateMonth}</div>
    </span>
  )
}
export function NameGarbageCollectorField({ dateMonth }) {
  return (
    <span className={s.rowText}>
      Вивіз ТПВ <div className={s.month}>{dateMonth}</div>
    </span>
  )
}
export function NameInflicionField({ service, company }) {
  const { form } = usePaymentContext()
  const inflicionPrice = Form.useWatch(['inflicionPrice', 'price'], form)
  const { previousMonth } = usePreviousMonthService({
    date: service?.date,
    domainId: form.getFieldValue('domain'),
    streetId: form.getFieldValue('street'),
  })
  return (
    <span className={s.rowText}>
      <InflicionIndexTitle previousMonth={previousMonth} />
    
      {!!company?.inflicion && (
        <span className={s.rowText}>
          {+inflicionPrice <= 0 && (
            <>
              <br />
              <span className={s.month}>Спостерігається дефляція.</span>
              <br />
              <span className={s.month}>Значення незмінне</span>
            </>
          )}
          <StyledTooltip title={inflicionDescription} />
        </span>
      )}
    </span>
  )
}
export function NameWaterPartField({ dateMonth }) {
  return (
    <span className={s.rowText}>
      Нарахування водопостачання
      <div className={s.month}>{dateMonth}</div>
    </span>
  )
}
export function NameDiscountField({ dateMonth }) {
  return (
    <span className={s.rowText}>
      Знижка <div className={s.month}>{dateMonth}</div>
    </span>
  )
}
