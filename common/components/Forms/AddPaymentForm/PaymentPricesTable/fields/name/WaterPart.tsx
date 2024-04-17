import { IPaymentField } from '@common/api/paymentApi/payment.api.types'

const WaterPart: React.FC<{
  record: IPaymentField & { key: string }
  preview?: boolean
}> = ({ record, preview }) => {
  return <>Частка одопостачання</>
}

export default WaterPart
