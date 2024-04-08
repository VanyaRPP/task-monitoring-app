import { Form } from 'antd'
import { Invoice } from '../..'

const Maintenance: React.FC<{
  record: Invoice
  preview?: boolean
}> = ({ record, preview }) => {
  return <Form.Item noStyle={preview}>Утримання</Form.Item>
}

export default Maintenance
