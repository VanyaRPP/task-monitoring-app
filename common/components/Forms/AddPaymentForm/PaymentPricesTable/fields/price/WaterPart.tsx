import { usePaymentContext } from '@common/components/AddPaymentModal'
import { useEffect } from 'react'
import { Invoice } from '../..'
import { Price } from './'

const WaterPart: React.FC<{
  record: Invoice
  preview?: boolean
}> = ({ record, preview }) => {
  const { form, payment, company, service } = usePaymentContext()

  useEffect(() => {
    if (!!payment && service?.waterPriceTotal && company?.waterPart) {
      form.setFieldValue(
        ['invoice', record.key, 'price'],
        (company.waterPart / 100) * service.waterPriceTotal
      )
    }
  }, [form, payment, company, service])

  return <Price record={record} preview={preview} />
}

export default WaterPart
