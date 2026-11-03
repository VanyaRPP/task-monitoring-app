import { useGetPaymentNumberQuery } from '@common/api/paymentApi/payment.api'
import { Form, InputNumber } from 'antd'
import { useEffect } from 'react'
import { inputNumberParser } from '@utils/helpers'

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
    <Form.Item
      name="invoiceNumber"
      label="№ інвойса"
      tooltip={
        // A new invoice gets its number from the server when it is saved, so
        // two invoices saved at once can't share one. The form only shows
        // the number it will most likely get.
        paymentInCreation
          ? 'Номер присвоюється автоматично при збереженні. Тут — очікуваний номер; він може зсунутися, якщо хтось збереже рахунок раніше.'
          : 'Порядковий номер рахунку.'
      }
    >
      <InputNumber
        parser={inputNumberParser}
        style={{ minWidth: '166px' }}
        placeholder="Вкажіть № інвойса"
        disabled={paymentActions?.preview || paymentInCreation}
      />
    </Form.Item>
  )
}
