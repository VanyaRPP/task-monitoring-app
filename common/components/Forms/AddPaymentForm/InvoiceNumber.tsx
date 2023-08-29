import { useGetPaymentsCountQuery } from '@common/api/paymentApi/payment.api'
import { Form, InputNumber } from 'antd'
import { useEffect } from 'react'
import s from "./style.module.scss"

export default function InvoiceNumber({ form, edit }) {
  const { data: invoiceNumber } = useGetPaymentsCountQuery(undefined, {
    skip: edit,
  })

  useEffect(() => {
    if (!edit) { 
      form.setFieldValue('invoiceNumber', invoiceNumber?.maxInvoiceNumber + 1)
    }
  }, [invoiceNumber]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item
      name="invoiceNumber"
      label="№ інвойса"
    >
      <InputNumber
        placeholder="Вкажіть № інвойса"
        disabled={edit}
      />
    </Form.Item>
  )
}
