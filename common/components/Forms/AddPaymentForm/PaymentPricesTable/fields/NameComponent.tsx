import { Invoice } from '@common/components/Forms/AddPaymentForm/PaymentPricesTable'
import { Form } from 'antd'

export const NameComponent: React.FC<{ record: Invoice }> = ({ record }) => {
  return (
    <Form.Item name={[record.name, 'name']}>
      {record.title || record.name}
    </Form.Item>
  )
}
