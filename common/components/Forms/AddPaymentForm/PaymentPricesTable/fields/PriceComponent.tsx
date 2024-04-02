import { usePaymentContext } from '@common/components/AddPaymentModal'
import { Invoice } from '@common/components/Forms/AddPaymentForm/PaymentPricesTable'
import { Form, Input } from 'antd'

export const PriceComponent: React.FC<{ record: Invoice; edit?: boolean }> = ({
  record,
  edit,
}) => {
  const baseName = ['invoice', record.type]
  const { form } = usePaymentContext()
  const price = Form.useWatch([...baseName, 'price'], form)

  return (
    <Form.Item
      name={[...baseName, 'price']}
      initialValue={record.price}
      // check for possible UI BUG: `edit: false` and initial value is `undefined | null`
      rules={[{ required: true, message: 'Required' }]}
    >
      {edit ? (
        <Input type="number" />
      ) : (
        <>{!price || isNaN(price) ? 0 : Number(price).toFixed(2)} грн</>
      )}
    </Form.Item>
  )
}
