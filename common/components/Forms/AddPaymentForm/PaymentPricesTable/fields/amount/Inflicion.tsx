import { usePaymentContext } from '@common/components/AddPaymentModal'
import { ServiceType } from '@utils/constants'
import { Invoice } from '../..'

const Inflicion: React.FC<{
  record: Invoice
  preview?: boolean
}> = ({ record, preview }) => {
  const { company, service, prevPayment } = usePaymentContext()

  if (company?.inflicion && prevPayment?.invoice && service) {
    const prevPlacingInvoice = prevPayment.invoice.find(
      (invoice) => invoice.type === ServiceType.Placing
    )
    const prevPlacing = prevPlacingInvoice?.sum || 0
    const inflicion = service.inflicionPrice - 100 || 0

    return (
      <>
        {(+inflicion).toFixed(2)}% від {(+prevPlacing).toFixed(2)}
      </>
    )
  }
}

export default Inflicion
