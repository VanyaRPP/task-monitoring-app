import { usePaymentContext } from '@common/components/AddPaymentModal'
import { useEffect } from 'react'
import { Invoice } from '../..'
import { Price } from './'

const Cleaning: React.FC<{
  record: Invoice
  preview?: boolean
}> = ({ record, preview }) => {
  const { form, payment, company } = usePaymentContext()

  useEffect(() => {
    if (!!payment && company?.cleaning) {
      form.setFieldValue(['invoice', record.key, 'price'], company.cleaning)
    }
  }, [form, payment, company])

  return <Price record={record} preview={preview} />
}

export default Cleaning
