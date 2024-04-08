import { Form, Input } from 'antd'
import { Invoice } from '../..'

const Custom: React.FC<{
  record: Invoice
  preview?: boolean
}> = ({ record, preview }) => {
  return (
    <Form.Item
      name={[record.key, 'name']}
      // TODO: NoDuplicates rule
      rules={[{ required: true, message: 'Required' }]}
      noStyle={preview}
    >
      {!preview ? <Input /> : record.name}
    </Form.Item>
  )
}

export default Custom
