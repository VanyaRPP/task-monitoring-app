import { Invoice } from '@common/components/Forms/AddPaymentForm/PaymentPricesTable'
import { Form, Input } from 'antd'

export const PriceComponent: React.FC<{ record: Invoice; edit?: boolean }> = ({
  record,
  edit,
}) => {
  return (
    <Form.Item name={[record.name, 'price']}>
      {record.editable ? (
        <Input disabled={!edit} value={record.data.price} />
      ) : (
        record.data.price + 'грн'
      )}
    </Form.Item>
  )
}
