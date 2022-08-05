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
  task: any
}

const CompetitionForm: React.FC<Props> = ({ isFormDisabled, form, task }) => {
  return (
    <Form
      form={form}
      id="competitionForm"
      style={{ position: 'relative' }}
      layout="vertical"
      name="form_in_modal"
      disabled={isFormDisabled}
    >
      <Form.Item
        normalize={allowOnlyNumbers}
        name="price"
        label="Ціна"
        rules={validateField('price')}
      >
        <Input addonAfter="₴" style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="description" label="Опис">
        <Input.TextArea maxLength={250} />
      </Form.Item>
      <Form.Item
        name="deadline"
        label={
          <CustomTooltip
            title="Коли ви очікуєте закінчити"
            text="Виконати до"
            placement="topLeft"
          />
        }
        // rules={validateField('deadline')}
      >
        <DatePicker
          placeholder="Оберіть датуу"
          getPopupContainer={() => document.getElementById('competitionForm')}
          disabledDate={disabledDate}
        />
      </Form.Item>
    </Form>
  )
}

export default CompetitionForm
