import React, { FC, useEffect, useState } from 'react'
import { Form, FormInstance } from 'antd'
import s from './style.module.scss'

interface Props {
  form: FormInstance<any>
}

const PaymentTotal: FC<Props> = ({ form }) => {
  const [total, setTotal] = useState(0)

  const maintenance = Form.useWatch('maintenance', form)
  const placing = Form.useWatch('placing', form)
  const electricity = Form.useWatch('electricity', form)
  const water = Form.useWatch('water', form)

  useEffect(() => {
    setTotal(maintenance?.sum + placing?.sum + electricity?.sum + water?.sum)
    if (maintenance) {
      alert(maintenance.sum)
    }
    form.setFieldValue('debit', total)
  }, [maintenance, placing, electricity, water, form, total])

  return (
    <Form.Item name="debit">
      <div className={s.totalItem}>
        <p>Сума:</p>
        <p>{total.toFixed(2)} ₴</p>
      </div>
    </Form.Item>
  )
}
export default PaymentTotal
