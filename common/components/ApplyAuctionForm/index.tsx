import { disabledDate } from '@common/assets/features/formatDate'
import {
  DatePicker,
  Form,
  FormInstance,
  Input,
  InputNumber,
  Select,
} from 'antd'

type PropsType = {
  isFormDisabled: boolean
  form: FormInstance
  // task: ITask
}

const ApplyAuctionForm: React.FC<PropsType> = ({ isFormDisabled, form }) => {
  const { Option } = Select

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
        label="Ціна"
        rules={[{ required: true, message: 'Введіть ціну послуги!' }]}
      >
        <InputNumber addonAfter={suffixSelector} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="description" label="Опис">
        <Input.TextArea maxLength={250} />
      </Form.Item>
      <Form.Item
        name="deadline"
        label="Виконати до"
        rules={[{ required: true }]}
      >
        <DatePicker disabledDate={disabledDate} placeholder="Оберіть дату" />
      </Form.Item>
    </Form>
  )
}

export default ApplyAuctionForm
