import { Form } from 'antd'
import { Invoice } from '../..'

const Discount: React.FC<{
  record: Invoice
  preview?: boolean
}> = ({ record, preview }) => {
  return <Form.Item>Знижка</Form.Item>
}

export default Discount
