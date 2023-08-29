import { useGetPaymentNumberQuery } from '@common/api/paymentApi/payment.api'
import { Form, InputNumber } from 'antd'
import { useEffect } from 'react'

export default function InvoiceNumber({ form, edit }) {
  const { data: newInvoiceNumber = 1 } = useGetPaymentNumberQuery(undefined, {
    skip: edit,
  })

  useEffect(() => {
    if (!edit) {
      form.setFieldValue('invoiceNumber', newInvoiceNumber)
    }
  }, [newInvoiceNumber]) // eslint-disable-line react-hooks/exhaustive-deps

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
