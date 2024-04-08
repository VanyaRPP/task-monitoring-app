import { Form } from 'antd'
import { Invoice } from '../..'

const WaterPart: React.FC<{
  record: Invoice
  preview?: boolean
}> = ({ record, preview }) => {
  return <Form.Item noStyle={preview}>Частка одопостачання</Form.Item>
}

export default WaterPart
