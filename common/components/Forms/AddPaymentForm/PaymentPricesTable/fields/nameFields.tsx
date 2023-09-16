import StyledTooltip from '@common/components/UI/Reusable/StyledTooltip'
import s from '../style.module.scss'
import {
  inflicionDescription,
  maintenanceWithoutInflicionDescription,
} from '@utils/constants'
import { Form } from 'antd'
import { usePaymentContext } from '@common/components/AddPaymentModal'
import useCompany from '@common/modules/hooks/useCompany'

export function NamePlacingField({ dateMonth, nameRes, company }) {
  return (
    <span className={s.rowText}>
      Розміщення <div className={s.month}>{dateMonth}</div>
      {!!company?.inflicion && (
        <span className={s.rowText}>
          <br />
          <span className={s.month}>без врах.інд.інф </span>
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
export function NameInflicionField({ dateMonth, edit }) {
  const { paymentData, form } = usePaymentContext()
  const companyId = Form.useWatch('company', form) || paymentData?.company
  const { company } = useCompany({ companyId, skip: edit })
  const inflicionPrice = Form.useWatch(['inflicionPrice', 'price'], form)

  return (
    <span className={s.rowText}>
      Індекс інфляції
    
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
