import { useGetPaymentsCountQuery } from '@common/api/paymentApi/payment.api'
import { Form, InputNumber } from 'antd'
import { useEffect } from 'react'

export default function InvoiceNumber({ form, edit }) {
  const { data: invoiceNumber = 0 } = useGetPaymentsCountQuery(undefined, {
    skip: edit,
  })

  useEffect(() => {
    form.setFieldValue('invoiceNumber', invoiceNumber + 1)
  }, [invoiceNumber]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Form.Item
      name="invoiceNumber"
      label="№ інвойса"
    >
      <InputNumber
        placeholder="Вкажіть № інвойса"
        disabled={edit}
        min={1}
      />
    </Form.Item>
  )
}
