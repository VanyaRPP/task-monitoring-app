import { Form } from 'antd'
import { Invoice } from '../..'

const Water: React.FC<{
  record: Invoice
  preview?: boolean
}> = ({ record, preview }) => {
  return <Form.Item noStyle={preview}>Водопостачання</Form.Item>
}

export default Water
