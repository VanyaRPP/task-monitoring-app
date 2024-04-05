import { usePaymentContext } from '@common/components/AddPaymentModal'
import { ServiceType } from '@utils/constants'
import { Invoice } from '../..'

const Inflicion: React.FC<{
  record: Invoice
  preview?: boolean
}> = ({ record, preview }) => {
  const { company, payment, prevPayment } = usePaymentContext()

  if (company?.inflicion && payment?.invoice && prevPayment?.invoice) {
    const prevPlacingInvoice = prevPayment.invoice.find(
      (invoice) => invoice.type === ServiceType.Placing
    )
    const inflicionInvoice = payment.invoice.find(
      (invoice) => invoice.type === ServiceType.Inflicion
    )
    const prevPlacing = prevPlacingInvoice?.sum || 0
    const inflicion = inflicionInvoice?.price - 100 || 0

    return (
      <>
        {(+inflicion).toFixed(2)}% від {(+prevPlacing).toFixed(2)}
      </>
    )
  }
}

export default Inflicion
