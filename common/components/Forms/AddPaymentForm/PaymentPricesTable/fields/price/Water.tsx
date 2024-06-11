import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { Price } from './'

const Water: React.FC<{
  record: IPaymentField & { key: string }
  preview?: boolean
}> = ({ record, preview }) => {
  return <Price record={record} preview={preview} />
}

export default Water