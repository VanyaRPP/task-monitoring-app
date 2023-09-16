import StyledTooltip from '@common/components/UI/Reusable/StyledTooltip'
import s from '../style.module.scss'
import {
  paymentsTitle,
  inflicionDescription,
  maintenanceWithoutInflicionDescription,
} from '@utils/constants'
import { Form } from 'antd'
import { usePaymentContext } from '@common/components/AddPaymentModal'
import useCompany from '@common/modules/hooks/useCompany'

export function NamePlacingField({ dateMonth, nameRes, company }) {
  const { paymentData } = usePaymentContext()

  return (
    <span className={s.rowText}>
      {nameRes} <span className={s.month}>{dateMonth}</span>
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
export function NameMaintainceField({ dateMonth, nameRes }) {
  return (
    <span className={s.rowText}>
      {nameRes} <span className={s.month}>{dateMonth}</span>
    </span>
  )
}
export function NameElectricityField({ dateMonth, nameRes }) {
  return (
    <span className={s.rowText}>
      {nameRes} <span className={s.month}>{dateMonth}</span>
    </span>
  )
}
export function NameWaterField({ dateMonth, nameRes }) {
  return (
    <span className={s.rowText}>
      {nameRes} <span className={s.month}>{dateMonth}</span>
    </span>
  )
}
export function NameGarbageCollectorField({ dateMonth, nameRes }) {
  return (
    <span className={s.rowText}>
      {nameRes} <span className={s.month}>{dateMonth}</span>
    </span>
  )
}
export function NameInflicionField({ dateMonth, nameRes, edit }) {
  const { paymentData, form } = usePaymentContext()
  const companyId = Form.useWatch('company', form) || paymentData?.company
  const { company } = useCompany({ companyId, skip: edit })
  // TODO: test
  const inflicionPrice = 2
  return (
    <span className={s.rowText}>
      {nameRes} <span className={s.month}>{dateMonth}</span>
      {!!company?.inflicion && nameRes === paymentsTitle.inflicionPrice && (
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
export function NameWaterPartField({ dateMonth, nameRes }) {
  return (
    <span className={s.rowText}>
      {nameRes} <span className={s.month}>{dateMonth}</span>
      {/* {nameRes || record.name} <span className={s.month}>{dateMonth}</span> */}
    </span>
  )
}
export function NameDiscountField({ dateMonth, nameRes }) {
  return (
    <span className={s.rowText}>
      {nameRes} <span className={s.month}>{dateMonth}</span>
    </span>
  )
}
