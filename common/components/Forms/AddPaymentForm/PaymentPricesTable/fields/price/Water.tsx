import { usePaymentContext } from '@common/components/AddPaymentModal'
import { useEffect } from 'react'
import { Invoice } from '../..'
import { Price } from './'

const Water: React.FC<{
  record: Invoice
  edit?: boolean
  preview?: boolean
}> = ({ record, edit, preview }) => {
  const { form, service } = usePaymentContext()

  useEffect(() => {
    if (!edit && service?.waterPrice) {
      form.setFieldValue(['invoice', record.key, 'price'], service.waterPrice)
    }
  }, [edit, form, service])

  return <Price record={record} preview={preview} />
}

export default Water
