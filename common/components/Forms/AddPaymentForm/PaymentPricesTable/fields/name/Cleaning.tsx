import { Form } from 'antd'
import { Invoice } from '../..'

const Cleaning: React.FC<{
  record: Invoice
  preview?: boolean
}> = ({ record, preview }) => {
  return <Form.Item>Прибирання</Form.Item>
}

export default Cleaning
