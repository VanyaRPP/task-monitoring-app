import { IPaymentField } from '@common/api/paymentApi/payment.api.types'

const GarbageCollector: React.FC<{
  record: IPaymentField & { key: string }
  preview?: boolean
}> = ({ record, preview }) => {
  return <>Вивіз ТПВ</>
}

export default GarbageCollector
