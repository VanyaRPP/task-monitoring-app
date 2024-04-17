import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { Amount } from './'

const Maintenance: React.FC<{
  record: IPaymentField & { key: string }
  preview?: boolean
}> = ({ record, preview }) => {
  return <Amount record={record} preview={preview} />
}

export default Maintenance
