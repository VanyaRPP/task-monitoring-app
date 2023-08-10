import React, { FC, useEffect, useState } from 'react'
import { Form, FormInstance } from 'antd'
import s from './style.module.scss'
import { Operations } from '@utils/constants'

interface Props {
  form: FormInstance<any>
}

const PaymentTotal: FC<Props> = ({ form }) => {
  const [total, setTotal] = useState(0)

  const formValues = Form.useWatch([], form)
  const services = formValues ?
    Object.values(formValues)
      .filter((item) => typeof item === 'object')
      .reduce((acc, val: any) => acc + (val.sum || 0), 0)
    : 0



  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    setTotal(services)
    form.setFieldValue(Operations.Debit, total)
  }, [
    form,
    total,
    services
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
