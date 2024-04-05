import { usePaymentContext } from '@common/components/AddPaymentModal'
import { Invoice } from '../..'

const GarbageCollector: React.FC<{
  record: Invoice
  preview?: boolean
}> = ({ record, preview }) => {
  const { company, service } = usePaymentContext()

  if (service?.garbageCollectorPrice && company?.rentPart) {
    return (
      <>
        {company.rentPart}% від {service.garbageCollectorPrice}
      </>
    )
  }
}

export default GarbageCollector
