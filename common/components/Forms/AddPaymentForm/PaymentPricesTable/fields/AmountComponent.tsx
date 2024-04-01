import { Invoice } from '@common/components/Forms/AddPaymentForm/PaymentPricesTable'
import { Form, Input } from 'antd'

export const AmountComponent: React.FC<{ record: Invoice; edit?: boolean }> = ({
  record,
  edit,
}) => {
  return (
    <Form.Item name={[record.name, 'amount']}>
      {record.editable ? (
        <Input disabled={!edit} value={record.data.amount} />
      ) : (
        record.data.amount
      )}
    </Form.Item>
  )
}
