import { usePaymentContext } from '@common/components/AddPaymentModal'
import { useEffect } from 'react'
import { Invoice } from '../..'
import { Price } from './'

const GarbageCollector: React.FC<{
  record: Invoice
  preview?: boolean
}> = ({ record, preview }) => {
  const { form, payment, company, service } = usePaymentContext()

  useEffect(() => {
    if (!!payment && service?.garbageCollectorPrice && company?.rentPart) {
      form.setFieldValue(
        ['invoice', record.key, 'price'],
        (service.garbageCollectorPrice / 100) * company.rentPart
      )
    }
  }, [form, payment, company, service])

  return <Price record={record} preview={preview} />
}

export default GarbageCollector
