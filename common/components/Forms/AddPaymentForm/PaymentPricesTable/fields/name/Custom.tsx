import { Form, Input } from 'antd'
import { Invoice } from '../..'

const Custom: React.FC<{
  record: Invoice
  edit?: boolean
  preview?: boolean
}> = ({ record, edit, preview }) => {
  return (
    <Form.Item
      name={[record.key, 'name']}
      // TODO: NoDuplicates rule
      rules={[{ required: true, message: 'Required' }]}
    >
      {!preview ? <Input /> : record.key}
    </Form.Item>
  )
}

export default Custom
