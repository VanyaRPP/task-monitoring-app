import { Form } from 'antd'
import { Invoice } from '../..'

const Electricity: React.FC<{
  record: Invoice
  preview?: boolean
}> = ({ record, preview }) => {
  return <Form.Item>Електропостачання</Form.Item>
}

export default Electricity
