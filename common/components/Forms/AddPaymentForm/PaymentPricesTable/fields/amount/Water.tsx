import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { Amount } from './'

const Water: React.FC<{
  record: IPaymentField & { key: string }
  preview?: boolean
}> = ({ record, preview }) => {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Amount record={record} preview={preview} last />
      <Amount record={record} preview={preview} />
    </div>
  )
}

export default Water
