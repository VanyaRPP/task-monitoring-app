import { usePaymentContext } from '@common/components/AddPaymentModal'
import { ServiceType } from '@utils/constants'
import { useEffect } from 'react'
import { Invoice } from '../..'
import { Price } from './'

const Placing: React.FC<{
  record: Invoice
  edit?: boolean
  preview?: boolean
}> = ({ record, edit, preview }) => {
  const { form, company, prevPayment } = usePaymentContext()

  useEffect(() => {
    if (!edit && company?.inflicion && prevPayment?.invoice) {
      const prevPlacingInvoice = prevPayment.invoice.find(
        (invoice) => invoice.type === ServiceType.Placing
      )
      const prevPlacing = prevPlacingInvoice?.sum || 0

      form.setFieldValue(['invoice', record.key, 'price'], prevPlacing)
    }
  }, [edit, form, company, prevPayment])

  return <Price record={record} preview={preview} />
}

export default Placing
