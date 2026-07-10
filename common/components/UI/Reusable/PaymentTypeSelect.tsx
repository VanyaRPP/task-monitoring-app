import { validateField } from '@assets/features/validators'
import { Operations } from '@utils/constants'
import { Form, Segmented } from 'antd'
import { CreditCardFilled, BankFilled } from '@ant-design/icons'
import styles from './style.module.scss'

const PaymentTypeSelect = () => {
  return (
    <Form.Item
      name="operation"
      label="Тип оплати"
      tooltip="Дебет (Реалізація) — нарахування за послуги переліком; Кредит (Оплата) — разова сума одним рядком."
      rules={validateField('required')}
    >
      <Segmented
        block
        className={styles.customSegmented} // Змінили назву класу
        options={[
          {
            label: (
              <div className={styles.segmentedLabel}>
                <CreditCardFilled />
                <span>Кредит (Оплата)</span>
              </div>
            ),
            value: Operations.Credit,
            className: styles.creditSegment,
          },
          {
            label: (
              <div className={styles.segmentedLabel}>
                <BankFilled />
                <span>Дебет (Реалізація)</span>
              </div>
            ),
            value: Operations.Debit,
            className: styles.debitSegment,
          },
        ]}
      />
    </Form.Item>
  )
}

export default PaymentTypeSelect
