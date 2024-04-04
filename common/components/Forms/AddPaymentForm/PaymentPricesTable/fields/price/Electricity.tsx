import { usePaymentContext } from '@common/components/AddPaymentModal'
import { useEffect } from 'react'
import { Invoice } from '../..'
import { Price } from './'

const Electricity: React.FC<{
  record: Invoice
  edit?: boolean
  preview?: boolean
}> = ({ record, edit, preview }) => {
  const { form, service } = usePaymentContext()

  useEffect(() => {
    if (!edit && service?.electricityPrice) {
      form.setFieldValue(
        ['invoice', record.key, 'price'],
        service.electricityPrice
      )
    }
  }, [edit && form, service])

  return <Price record={record} preview={preview} />
}

export default Electricity
