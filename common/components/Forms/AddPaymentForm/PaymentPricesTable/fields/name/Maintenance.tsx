import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { usePaymentContext } from '@common/components/AddPaymentModal'
import { getFormattedDate } from '@utils/helpers'
import s from './style.module.scss'

const Maintenance: React.FC<{
  record: IPaymentField & { key: string }
  preview?: boolean
}> = ({ record, preview }) => {
  const { service } = usePaymentContext()
  return (
    <div className={s.Cell}>
      Утримання
      <span className={s.Sub}>{getFormattedDate(service?.date)}</span>
    </div>
  )
}

export default Maintenance