import { IPaymentField } from '@common/api/paymentApi/payment.api.types'

const Inflicion: React.FC<{
  record: IPaymentField & { key: string }
  preview?: boolean
}> = ({ record, preview }) => {
  return <>Індекс інфляції</>
}

export default Inflicion
