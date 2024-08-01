import { getFormattedDate } from '@assets/features/formatDate'
import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { usePaymentContext } from '@components/AddPaymentModal'
import s from './style.module.scss'

const Electricity: React.FC<{
  record: IPaymentField & { key: string }
  preview?: boolean
}> = ({ record, preview }) => {
  const { service } = usePaymentContext()
  return (
    <div className={s.Cell}>
      Електропостачання
      <span className={s.Sub}>{getFormattedDate(service?.date)}</span>
    </div>
  )
}

export default Electricity
