import { IPaymentField } from '@common/api/paymentApi/payment.api.types'

const Maintenance: React.FC<{
  record: IPaymentField & { key: string }
  preview?: boolean
}> = ({ record, preview }) => {
  return <>Утримання</>
}

export default Maintenance
