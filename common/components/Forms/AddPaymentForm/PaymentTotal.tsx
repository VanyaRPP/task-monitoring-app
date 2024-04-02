import { Operations } from '@utils/constants'
import { Form, FormInstance } from 'antd'
import { FC, useEffect } from 'react'
import s from './style.module.scss'

interface Props {
  form: FormInstance<any>
}

const PaymentTotal: FC<Props> = ({ form }) => {
  const invoices = Form.useWatch(['invoice'], form)
  const total = Form.useWatch(Operations.Debit, form)

  useEffect(() => {
    const newTotal = Object.entries<{ sum: number }>(invoices || []).reduce(
      (totalSum: number, invoice) => totalSum + (invoice[1].sum || 0),
      0
    )
    form.setFieldValue(Operations.Debit, newTotal)
  }, [invoices, form])

  return (
    <Form.Item name={Operations.Debit} initialValue={0}>
      <div className={s.totalItem}>
        <p>Сума: {total?.toFixed(2)} ₴</p>
      </div>
    </Form.Item>
  )
}

export default PaymentTotal
