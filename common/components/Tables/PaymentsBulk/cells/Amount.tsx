import { Form, Input } from 'antd'
import validator from '@utils/validator'

export const Amount: React.FC<{ name: number; fieldName: string }> = ({
  name,
  fieldName,
}) => (
  <Form.Item
    name={[name, 'invoice', fieldName, 'amount']}
    initialValue={1}
    rules={[validator.required(), validator.min(1)]}
    style={{ margin: 0 }}
  >
    <Input type="number" placeholder="К-сть..." />
  </Form.Item>
)
