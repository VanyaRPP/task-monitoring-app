import { Form, Select } from 'antd'
import { validateField } from '@common/assets/features/validators'
import { Operations } from '@utils/constants'

const PaymentTypeSelect = ({ edit }: { edit?: boolean }) => {
  return (
    <Form.Item
      name="operation"
      label="Тип оплати"
      rules={validateField('required')}
    >
      <Select placeholder="Оберіть тип оплати" disabled={edit}>
        <Select.Option value={Operations.Credit}>Кредит (Оплата)</Select.Option>
        <Select.Option value={Operations.Debit}>
          Дебет (Реалізація)
        </Select.Option>
      </Select>
    </Form.Item>
  )
}

export default PaymentTypeSelect
