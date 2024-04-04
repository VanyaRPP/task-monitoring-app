import { usePaymentContext } from '@common/components/AddPaymentModal'
import { useEffect } from 'react'
import { Invoice } from '../..'
import { Price } from './'

const Cleaning: React.FC<{
  record: Invoice
  edit?: boolean
  preview?: boolean
}> = ({ record, edit, preview }) => {
  const { form, company } = usePaymentContext()

  useEffect(() => {
    if (!edit && company?.cleaning) {
      form.setFieldValue(['invoice', record.key, 'price'], company.cleaning)
    }
  }, [edit, form, company])

  return <Price record={record} preview={preview} />
}

export default Cleaning
