import { DatePicker, Form, FormInstance, Input } from 'antd'
import CustomTooltip from '../../UI/CustomTooltip'
import {
  allowOnlyNumbers,
  validateField,
} from '../../../assets/features/validators'
import { disabledDate } from '../../../assets/features/formatDate'

interface Props {
  isFormDisabled: boolean
  form: FormInstance
}

const CompetitionForm: React.FC<Props> = ({ isFormDisabled, form }) => {
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
