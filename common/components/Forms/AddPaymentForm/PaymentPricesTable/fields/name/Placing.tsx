import { Form } from 'antd'
import { Invoice } from '../..'

const Placing: React.FC<{
  record: Invoice
  preview?: boolean
}> = ({ record, preview }) => {
  return <Form.Item noStyle={preview}>Розміщення</Form.Item>
}

export default Placing
