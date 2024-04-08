import { Form } from 'antd'
import { Invoice } from '../..'

const Unknown: React.FC<{
  record: Invoice
  preview?: boolean
}> = ({ record, preview }) => {
  return <Form.Item noStyle={preview}>Unknown</Form.Item>
}

export default Unknown
