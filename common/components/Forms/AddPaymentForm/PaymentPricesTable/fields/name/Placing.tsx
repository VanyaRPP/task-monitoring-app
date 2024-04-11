import { IPaymentField } from '@common/api/paymentApi/payment.api.types'

const Placing: React.FC<{
  record: IPaymentField & { key: string }
  preview?: boolean
}> = ({ record, preview }) => {
  return <>Розміщення</>
}

export default Placing
