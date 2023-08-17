import { useGetPaymentsCountQuery } from '@common/api/paymentApi/payment.api'
import { Form, InputNumber } from 'antd'
import { useEffect } from 'react'
import s from "./style.module.scss"

export default function InvoiceNumber({ form, edit }) {
  // TODO: fix. currently get count. but should take biggest number
  // don't know how to fix. yet
  // but should be aggregation (think so)
  // should take max number from all invoices and +1
  const { data: invoiceNumber = 0 } = useGetPaymentsCountQuery(undefined, {
    skip: edit,
  })

  useEffect(() => {
    if (!edit) { 
      form.setFieldValue('invoiceNumber', invoiceNumber + 1)
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
