import { Form } from 'antd'
import { Invoice } from '../..'

const Inflicion: React.FC<{
  record: Invoice
  preview?: boolean
}> = ({ record, preview }) => {
  return <Form.Item noStyle={preview}>Індекс інфляції</Form.Item>
}

export default Inflicion
