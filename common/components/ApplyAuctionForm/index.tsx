import {
  DatePicker,
  Form,
  FormInstance,
  Input,
  InputNumber,
  Select,
} from 'antd'
import { RangePickerProps } from 'antd/lib/date-picker'
import moment from 'moment'

type PropsType = {
  isFormDisabled: boolean
  form: FormInstance
}

const ApplyAuctionForm: React.FC<PropsType> = ({ isFormDisabled, form }) => {
  const { Option } = Select

  const disabledDate: RangePickerProps['disabledDate'] = (current) => {
    return current && current < moment().startOf('day')
  }

  const suffixSelector = (
    <Form.Item name="suffix" noStyle>
      <Select defaultValue="UAH" style={{ width: 70 }}>
        <Option value="UAH">₴</Option>
        <Option value="USD">$</Option>
      </Select>
    </Form.Item>
  )
  return (
    <Form
      form={form}
      layout="vertical"
      name="form_in_modal"
      disabled={isFormDisabled}
    >
      <Form.Item
        name="price"
        label="Price"
        rules={[{ required: true, message: 'Please input amount of money!' }]}
      >
        <InputNumber addonAfter={suffixSelector} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="description" label="Description">
        <Input.TextArea maxLength={250} />
      </Form.Item>
      <Form.Item name="deadline" label="Deadline" rules={[{ required: true }]}>
        <DatePicker disabledDate={disabledDate} />
      </Form.Item>
    </Form>
  )
}

export default ApplyAuctionForm
