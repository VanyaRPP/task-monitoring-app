import { validateField } from '@assets/features/validators'
import { Operations } from '@utils/constants'
import { Form, Select, Tag } from 'antd'

import { CreditCardFilled, BankFilled } from '@ant-design/icons'

const PaymentTypeSelect = ({ edit }: { edit?: boolean }) => {
  return (
    <Form.Item
      name="operation"
      label="Тип оплати"
      rules={validateField('required')}
    >
      <Select placeholder="Оберіть тип оплати">
        <Select.Option value={Operations.Credit}>
          <Tag 
            color="purple" 
            style={{ display: 'inline-flex', alignItems: 'center', margin: 0, gap: '6px' }}
          >
            <CreditCardFilled />
            Кредит (Оплата)
          </Tag>
        </Select.Option>
        
        <Select.Option value={Operations.Debit}>
          <Tag 
            color="success" 
            style={{ display: 'inline-flex', alignItems: 'center', margin: 0, gap: '6px' }}
          >
            <BankFilled />
            Дебет (Реалізація)
          </Tag>
        </Select.Option>
      </Select>
    </Form.Item>
  )
}

export default PaymentTypeSelect