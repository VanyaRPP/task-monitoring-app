import { IPaymentField } from '@common/api/paymentApi/payment.api.types'

const Unknown: React.FC<{
  record: IPaymentField & { key: string }
}> = ({ record }) => {
  return <>0.00 грн</>
}

export default Unknown
