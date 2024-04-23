import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { Form, Input } from 'antd'
import { usePaymentContext } from '@common/components/AddPaymentModal'
import { getFormattedDate } from '@utils/helpers'
import s from './style.module.scss'

const Custom: React.FC<{
  record: IPaymentField & { key: string }
  preview?: boolean
}> = ({ record, preview }) => {
  const { service } = usePaymentContext()
  if (preview) {
    return (
      <div className={s.Cell}>
        {record.name}
        <span className={s.Sub}>{getFormattedDate(service?.date)}</span>
      </div>
    )
  }

  return (
    <Form.Item
      name={[record.key, 'name']}
      // TODO: NoDuplicates rule
      rules={[{ required: true, message: 'Required' }]}
    >
      <Input />
    </Form.Item>
  )
}

export default Custom
