import { QuestionCircleOutlined } from '@ant-design/icons'
import {
  DatePicker,
  Form,
  FormInstance,
  Input,
  InputNumber,
  Select,
  Tooltip,
} from 'antd'
import { RangePickerProps } from 'antd/lib/date-picker'
import moment from 'moment'
import CustomTooltip from '../../UI/CustomTooltip'
import { allowOnlyNumbers, validateField } from '../validators'

type PropsType = {
  isFormDisabled: boolean
  form: FormInstance
}

const CompetitionForm: React.FC<PropsType> = ({ isFormDisabled, form }) => {
  const { Option } = Select

  const disabledDate: RangePickerProps['disabledDate'] = (current) => {
    return current && current < moment().startOf('day')
  }

  return (
    <Form
      form={form}
      layout="vertical"
      name="form_in_modal"
      disabled={isFormDisabled}
    >
      <Form.Item
        normalize={allowOnlyNumbers}
        name="price"
        label="Price"
        rules={validateField('price')}
      >
        <Input addonAfter="₴" style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="description" label="Description">
        <Input.TextArea maxLength={250} />
      </Form.Item>
      <Form.Item
        name="deadline"
        label={
          <CustomTooltip
            title="When you expect to finish"
            text="Deadline"
            placement="topLeft"
          />
        }
        rules={validateField('deadline')}
      >
        <DatePicker disabledDate={disabledDate} />
      </Form.Item>
    </Form>
  )
}

export default CompetitionForm
