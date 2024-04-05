import { usePaymentContext } from '@common/components/AddPaymentModal'
import { useEffect } from 'react'
import { Invoice } from '../..'
import { Price } from './'

const Water: React.FC<{
  record: Invoice
  preview?: boolean
}> = ({ record, preview }) => {
  const { form, payment, service } = usePaymentContext()

  useEffect(() => {
    if (!!payment && service?.waterPrice) {
      form.setFieldValue(['invoice', record.key, 'price'], service.waterPrice)
    }
  }, [form, payment, service])

  return <Price record={record} preview={preview} />
}

export default Water
