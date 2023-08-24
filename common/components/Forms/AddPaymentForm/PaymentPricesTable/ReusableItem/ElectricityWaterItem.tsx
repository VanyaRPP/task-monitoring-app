import React, { useEffect } from 'react'
import { Form, InputNumber } from 'antd'
import { validateField } from '@common/assets/features/validators'
import s from '@common/components/Forms/AddPaymentForm/PaymentPricesTable/style.module.scss'

interface DoubleInputProps {
  name: string
  edit: boolean
  initialLastAmount?: number // Проп для отримання початкового значення lastAmount
}

const DoubleInput: React.FC<DoubleInputProps> = ({
  name,
  edit,
  initialLastAmount,
}) => {
  const [lastAmount, setLastAmount] = React.useState<number | undefined>(
    initialLastAmount
  )

  useEffect(() => {
    setLastAmount(initialLastAmount)
  }, [initialLastAmount])

  return (
    <div className={s.doubleInputs}>
      <Form.Item name={[name, 'lastAmount']} rules={validateField('required')}>
        <InputNumber
          disabled={edit}
          className={s.input}
          value={lastAmount} // Встановлюємо значення зі стану
          onChange={(value) => setLastAmount(value)} // Оновлюємо стан при зміні введення
        />
      </Form.Item>

      <Form.Item name={[name, 'amount']} rules={validateField('required')}>
        <InputNumber disabled={edit} className={s.input} />
      </Form.Item>
    </div>
  )
}

export default DoubleInput
