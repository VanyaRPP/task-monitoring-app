import { Form } from 'antd'
import { Invoice } from '../..'

const WaterPart: React.FC<{
  record: Invoice
  preview?: boolean
}> = ({ record, preview }) => {
  return <Form.Item>Частка одопостачання</Form.Item>
}

export default WaterPart
