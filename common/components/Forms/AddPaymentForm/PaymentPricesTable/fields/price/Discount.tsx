import { usePaymentContext } from '@common/components/AddPaymentModal'
import { useEffect } from 'react'
import { Invoice } from '../..'
import { Price } from './'

const Discount: React.FC<{
  record: Invoice
  preview?: boolean
}> = ({ record, preview }) => {
  const { form, payment, company } = usePaymentContext()

  useEffect(() => {
    if (!!payment && company?.discount) {
      form.setFieldValue(['invoice', record.key, 'price'], company.discount)
    }
  }, [form, payment, company])

  return <Price record={record} preview={preview} />
}

export default Discount
