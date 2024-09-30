import { useGetPaymentNumberQuery } from '@common/api/paymentApi/payment.api'
import { Form, InputNumber } from 'antd'
import { useEffect } from 'react'
import {inputNumberParser} from "@utils/helpers";

export default function InvoiceNumber({ form, paymentActions }) {
  const paymentInCreation = Object.values(paymentActions).every(
    (action) => action === false
  )
  const { data: newInvoiceNumber = 1 } = useGetPaymentNumberQuery(undefined, {
    skip: !paymentInCreation,
  })

  useEffect(() => {
    if (paymentInCreation) {
      form.setFieldValue('invoiceNumber', newInvoiceNumber)
    }
  }, [newInvoiceNumber]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item name="invoiceNumber" label="№ інвойса">
      <InputNumber parser={inputNumberParser}
        style={{ minWidth: '166px' }}
        placeholder="Вкажіть № інвойса"
        disabled={paymentActions?.preview}
      />
    </Form.Item>
  )
}
