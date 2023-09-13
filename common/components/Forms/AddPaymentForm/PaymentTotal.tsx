import { parseStringToFloat } from '@common/components/UI/PaymentCardHeader/ImportInvoices/ImportInvoicesModal'
import React, { FC, useEffect, useState } from 'react'
import { Operations } from '@utils/constants'
import { Form, FormInstance } from 'antd'
import s from './style.module.scss'

interface Props {
  form: FormInstance<any>
}

const PaymentTotal: FC<Props> = ({ form }) => {
  const [total, setTotal] = useState(0)

  const formValues = Form.useWatch([], form)
  const services = formValues
    ? Object.values(formValues)
        .filter((item) => typeof item === 'object')
        .reduce(
          (acc: number, val: any) => acc + +parseStringToFloat(val?.sum || 0),
          0
        )
    : 0

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    setTotal(services)
    form.setFieldValue(Operations.Debit, total.toFixed(2))
  }, [form, total, services])

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
