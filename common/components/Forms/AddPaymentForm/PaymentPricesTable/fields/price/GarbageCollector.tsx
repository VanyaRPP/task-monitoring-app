import { usePaymentContext } from '@common/components/AddPaymentModal'
import { useEffect } from 'react'
import { Invoice } from '../..'
import { Price } from './'

const GarbageCollector: React.FC<{
  record: Invoice
  edit?: boolean
  preview?: boolean
}> = ({ record, edit, preview }) => {
  const { form, company, service } = usePaymentContext()

  useEffect(() => {
    if (!edit && service?.garbageCollectorPrice && company?.rentPart) {
      form.setFieldValue(
        ['invoice', record.key, 'price'],
        (service.garbageCollectorPrice / 100) * company.rentPart
      )
    }
  }, [edit, form, company, service])

  return <Price record={record} preview={preview} />
}

export default GarbageCollector
