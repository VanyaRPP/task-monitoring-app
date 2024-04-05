import { usePaymentContext } from '@common/components/AddPaymentModal'
import { ServiceType } from '@utils/constants'
import { useEffect } from 'react'
import { Invoice } from '../..'
import { Price } from './'

const Placing: React.FC<{
  record: Invoice
  preview?: boolean
}> = ({ record, preview }) => {
  const { form, payment, company, prevPayment } = usePaymentContext()

  useEffect(() => {
    if (!!payment && company?.inflicion && prevPayment?.invoice) {
      const prevPlacingInvoice = prevPayment.invoice.find(
        (invoice) => invoice.type === ServiceType.Placing
      )
      const prevPlacing = prevPlacingInvoice?.sum || 0

      form.setFieldValue(['invoice', record.key, 'price'], prevPlacing)
    }
  }, [form, payment, company, prevPayment])

  return <Price record={record} preview={preview} />
}

export default Placing
