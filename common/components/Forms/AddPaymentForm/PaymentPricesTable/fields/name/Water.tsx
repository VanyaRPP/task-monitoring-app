import { IPaymentField } from '@common/api/paymentApi/payment.api.types'

const Water: React.FC<{
  record: IPaymentField & { key: string }
  preview?: boolean
}> = ({ record, preview }) => {
  return <>Водопостачання</>
}

export default Water
