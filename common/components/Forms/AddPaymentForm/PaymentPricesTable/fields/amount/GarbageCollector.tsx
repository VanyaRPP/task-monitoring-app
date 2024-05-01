import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { usePaymentContext } from '@common/components/AddPaymentModal'

const GarbageCollector: React.FC<{
  record: IPaymentField & { key: string }
  preview?: boolean
}> = ({ record, preview }) => {
  const { company, service } = usePaymentContext()

  if (service?.garbageCollectorPrice && company?.rentPart) {
    return (
      <>
        {company.rentPart.toRoundFixed()}% від{' '}
        {service.garbageCollectorPrice.toRoundFixed()}
      </>
    )
  }
}

export default GarbageCollector
