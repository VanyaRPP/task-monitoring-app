import { usePaymentContext } from '@common/components/AddPaymentModal'
import { useEffect } from 'react'
import { Invoice } from '../..'
import { Price } from './'

const WaterPart: React.FC<{
  record: Invoice
  edit?: boolean
  preview?: boolean
}> = ({ record, edit, preview }) => {
  const { form, company, service } = usePaymentContext()

  useEffect(() => {
    if (!edit && service?.waterPriceTotal && company?.waterPart) {
      form.setFieldValue(
        ['invoice', record.key, 'price'],
        (company.waterPart / 100) * service.waterPriceTotal
      )
    }
  }, [edit, form, company, service])

  return <Price record={record} preview={preview} />
}

export default WaterPart
