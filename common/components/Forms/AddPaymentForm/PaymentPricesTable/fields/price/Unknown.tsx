import { IPaymentField } from '@common/api/paymentApi/payment.api.types'

const Unknown: React.FC<{
  record: IPaymentField & { key: string }
  preview?: boolean
}> = ({ record, preview }) => {
  return <>Unknown</>
}

export default Unknown
