import { disabledDate } from '@assets/features/formatDate'
import {
  DatePicker,
  Form,
  FormInstance,
  Input,
  InputNumber,
  Select,
} from 'antd'
import {inputNumberParser} from "@utils/helpers";

type PropsType = {
  isFormDisabled: boolean
  form: FormInstance
  // task: ITask
  setIsValueChanged: (value: boolean) => void
}

const ApplyAuctionForm: React.FC<PropsType> = ({
  isFormDisabled,
  form,
  setIsValueChanged,
}) => {
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
      onValuesChange={() => setIsValueChanged(true)}
    >
      <Form.Item
        name="price"
        label="Ціна"
        rules={[{ required: true, message: 'Введіть ціну послуги!' }]}
      >
        <InputNumber parser={inputNumberParser} addonAfter={suffixSelector} style={{ width: '100%' }} />
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
