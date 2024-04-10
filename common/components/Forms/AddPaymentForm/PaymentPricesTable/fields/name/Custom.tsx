import { Form, Input } from 'antd'
import { Invoice } from '../..'

const Custom: React.FC<{
  record: Invoice
  preview?: boolean
}> = ({ record, preview }) => {
  if (preview) {
    return <>{record.name}</>
  }

  return (
    <Form.Item
      name={[record.key, 'name']}
      // TODO: NoDuplicates rule
      rules={[{ required: true, message: 'Required' }]}
    >
      <Input />
    </Form.Item>
  )
}

export default Custom
