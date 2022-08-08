import { DatePicker, Form, FormInstance, Input } from 'antd'
import CustomTooltip from '../../UI/CustomTooltip'
import {
  allowOnlyNumbers,
  validateField,
} from '../../../assets/features/validators'
import { disabledDate } from '../../../assets/features/formatDate'
import moment from 'moment'
import { RangePickerProps } from 'antd/lib/date-picker'
import { ITask } from '../../../modules/models/Task'

interface Props {
  isFormDisabled: boolean
  form: FormInstance
  task: ITask
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
      >
        <DatePicker
          placeholder="Оберіть дату"
          getPopupContainer={() => document.getElementById('competitionForm')}
          disabledDate={(current) =>
            !current ||
            current < moment().locale('uk').startOf('day') ||
            current.isSameOrAfter(moment(task?.deadline).add(1, 'day'))
          }
        />
      </Form.Item>
    </Form>
  )
}

export default CompetitionForm
