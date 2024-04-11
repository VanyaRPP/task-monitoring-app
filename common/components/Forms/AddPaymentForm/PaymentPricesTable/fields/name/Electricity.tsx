import { IPaymentField } from '@common/api/paymentApi/payment.api.types'

const Electricity: React.FC<{
  record: IPaymentField & { key: string }
  preview?: boolean
}> = ({ record, preview }) => {
  return <>Електропостачання</>
}

export default Electricity
