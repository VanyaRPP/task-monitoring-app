import React, { FC, useEffect, useState } from 'react'
import { Form, FormInstance } from 'antd'
import s from './style.module.scss'
import { Operations } from '@utils/constants'

interface Props {
  form: FormInstance<any>
}

const PaymentTotal: FC<Props> = ({ form }) => {
  const [total, setTotal] = useState(0)

  const maintenancePrice = Form.useWatch('maintenancePrice', form)
  const placingPrice = Form.useWatch('placingPrice', form)
  const electricityPrice = Form.useWatch('electricityPrice', form)
  const waterPrice = Form.useWatch('waterPrice', form)

  useEffect(() => {
    setTotal(
      maintenancePrice?.sum +
        placingPrice?.sum +
        electricityPrice?.sum +
        waterPrice?.sum
    )
    form.setFieldValue(Operations.Debit, total)
  }, [
    maintenancePrice,
    placingPrice,
    electricityPrice,
    waterPrice,
    form,
    total,
  ])

  return (
    <Form.Item name={Operations.Debit}>
      <div className={s.totalItem}>
        <p>Сума:</p>
        <p>{total.toFixed(2)} ₴</p>
      </div>
    </Form.Item>
  )
}
export default PaymentTotal
