import { usePaymentContext } from '@common/components/AddPaymentModal'
import { useEffect } from 'react'
import { Invoice } from '../..'
import { Price } from './'

const Electricity: React.FC<{
  record: Invoice
  preview?: boolean
}> = ({ record, preview }) => {
  const { form, payment, service } = usePaymentContext()

  useEffect(() => {
    if (!!payment && service?.electricityPrice) {
      form.setFieldValue(
        ['invoice', record.key, 'price'],
        service.electricityPrice
      )
    }
  }, [form, payment, service])

  return <Price record={record} preview={preview} />
}

export default Electricity
