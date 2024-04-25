import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { usePaymentContext } from '@common/components/AddPaymentModal'
import { parseStringToFloat } from '@utils/helpers'

const GarbageCollector: React.FC<{
  record: IPaymentField & { key: string }
  preview?: boolean
}> = ({ record, preview }) => {
  const { company, service } = usePaymentContext()

  if (service?.garbageCollectorPrice && company?.rentPart) {
    return (
      <>
        {parseStringToFloat(company.rentPart)}% від{' '}
        {parseStringToFloat(service.garbageCollectorPrice)}
      </>
    )
  }
}

export default GarbageCollector
