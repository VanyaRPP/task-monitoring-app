import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { usePaymentContext } from '@components/AddPaymentModal'
import { getCurrencySymbol } from '@utils/helpers'

const Unknown: React.FC<{
  record: IPaymentField & { key: string }
}> = ({ record }) => {
  const { form } = usePaymentContext()
  const company = form.getFieldValue('company')
  const domain = form.getFieldValue('domain')
  const currencyLabel = getCurrencySymbol(company?.currency || domain?.currency)

  return <>0 {currencyLabel}</>
}

export default Unknown
