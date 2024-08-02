import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { usePaymentContext } from '@components/AddPaymentModal'
import { toRoundFixed } from '@utils/helpers'

const GarbageCollector: React.FC<{
  record: IPaymentField & { key: string }
  preview?: boolean
}> = ({ record, preview }) => {
  const { company, service } = usePaymentContext()

  if (service?.garbageCollectorPrice && company?.rentPart) {
    return (
      <>
        {toRoundFixed(company.rentPart)}% від{' '}
        {toRoundFixed(service.garbageCollectorPrice)}
      </>
    )
  }
}

export default GarbageCollector
