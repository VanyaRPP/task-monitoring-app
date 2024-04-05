import { Form } from 'antd'
import { Invoice } from '../..'

const Water: React.FC<{
  record: Invoice
  preview?: boolean
}> = ({ record, preview }) => {
  return <Form.Item>Водопостачання</Form.Item>
}

export default Water
