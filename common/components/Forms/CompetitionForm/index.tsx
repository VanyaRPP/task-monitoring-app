import { allowOnlyNumbers, validateField } from '@assets/features/validators'
import CustomTooltip from '@components/UI/CustomTooltip'
import { ITask } from '@modules/models/Task'
import { DatePicker, Form, FormInstance, Input } from 'antd'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'

dayjs.extend(isSameOrAfter)

interface Props {
  isFormDisabled: boolean
  form: FormInstance
  task: ITask

  setIsValueChanged: (value: boolean) => void
}

const CompetitionForm: React.FC<Props> = ({
  isFormDisabled,
  form,
  task,
  setIsValueChanged,
}) => {
  return (
    <Form
      form={form}
      id="competitionForm"
      style={{ position: 'relative' }}
      layout="vertical"
      name="form_in_modal"
      disabled={isFormDisabled}
      onValuesChange={() => setIsValueChanged(true)}
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
            current < dayjs().locale('uk').startOf('day') ||
            current.isSameOrAfter(dayjs(task?.deadline).add(1, 'day'))
          }
        />
      </Form.Item>
    </Form>
  )
}

export default CompetitionForm
