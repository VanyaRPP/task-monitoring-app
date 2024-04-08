import { Form } from 'antd'
import { Invoice } from '../..'

const Discount: React.FC<{
  record: Invoice
  preview?: boolean
}> = ({ record, preview }) => {
  return <Form.Item noStyle={preview}>Знижка</Form.Item>
}

export default Discount
