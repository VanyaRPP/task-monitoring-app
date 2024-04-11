import { IPaymentField } from '@common/api/paymentApi/payment.api.types'

const Cleaning: React.FC<{
  record: IPaymentField & { key: string }
  preview?: boolean
}> = ({ record, preview }) => {
  return <>Прибирання</>
}

export default Cleaning
