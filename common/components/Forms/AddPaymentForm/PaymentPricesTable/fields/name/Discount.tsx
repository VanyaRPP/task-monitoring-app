import { IPaymentField } from '@common/api/paymentApi/payment.api.types'

const Discount: React.FC<{
  record: IPaymentField & { key: string }
  preview?: boolean
}> = ({ record, preview }) => {
  return <>Знижка</>
}

export default Discount
