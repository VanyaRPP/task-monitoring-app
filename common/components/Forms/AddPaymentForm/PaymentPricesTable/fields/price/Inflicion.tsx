import { usePaymentContext } from '@common/components/AddPaymentModal'
import { ServiceType } from '@utils/constants'
import { useEffect } from 'react'
import { Invoice } from '../..'
import { Price } from './'

const Inflicion: React.FC<{
  record: Invoice
  edit?: boolean
  preview?: boolean
}> = ({ record, edit, preview }) => {
  const { form, company, prevService, prevPayment } = usePaymentContext()

  useEffect(() => {
    if (
      !edit &&
      company?.inflicion &&
      prevPayment?.invoice &&
      prevService?.inflicionPrice
    ) {
      const prevPlacingInvoice = prevPayment.invoice.find(
        (invoice) => invoice.type === ServiceType.Placing
      )
      const prevPlacing = prevPlacingInvoice?.sum || 0
      const inflicion = prevService.inflicionPrice

      form.setFieldValue(
        ['invoice', record.key, 'price'],
        Math.max((+prevPlacing * (+inflicion - 100)) / 100, 0)
      )
    }
  }, [edit, form, company, prevService, prevPayment])

  return <Price record={record} preview={preview} />
}

export default Inflicion
