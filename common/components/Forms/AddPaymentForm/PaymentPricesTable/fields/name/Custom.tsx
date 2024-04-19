import { IPaymentField } from '@common/api/paymentApi/payment.api.types'
import { Form, Input } from 'antd'

const Custom: React.FC<{
  record: IPaymentField & { key: string }
  preview?: boolean
}> = ({ record, preview }) => {
  if (preview) {
    return <>{record.name}</>
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
