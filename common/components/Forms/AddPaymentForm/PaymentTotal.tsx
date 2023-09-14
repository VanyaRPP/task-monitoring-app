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
  const result = formValues
    ? Object.values(formValues)
        .filter((item) => typeof item === 'object')
        .reduce(
          (acc: number, val: any) => acc + +val?.sum || 0,
          0
        )
    : 0

  useEffect(() => {
    const r = (result as number).toFixed(2) || 0
    setTotal(r as number)
    form.setFieldValue(Operations.Debit, r)
  }, [form, result])

  return (
    <Form.Item name={Operations.Debit}>
      <div className={s.totalItem}>
        <p>Сума:</p>
        <p>{total} ₴</p>
      </div>
    </Form.Item>
  )
}
export default PaymentTotal
