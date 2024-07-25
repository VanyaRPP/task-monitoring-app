import { Operations } from '@utils/constants'
import { getCurrencySymbol } from '@utils/helpers'
import { usePaymentContext } from '@components/AddPaymentModal'
import { Form, FormInstance } from 'antd'
import { FC, useEffect } from 'react'

interface Props {
  form: FormInstance<any>
}

const PaymentTotal: FC<Props> = ({ form }) => {
  const { company } = usePaymentContext()
  const invoices = Form.useWatch(['invoice'], form)
  const total = Form.useWatch(Operations.Debit, form)
  const currencyLabel = getCurrencySymbol(company?.currency)

  useEffect(() => {
    const newTotal = Object.entries<{ sum: number }>(invoices || []).reduce(
      (totalSum: number, invoice) => totalSum + (invoice[1].sum || 0),
      0
    )
    form.setFieldValue(Operations.Debit, newTotal)
  }, [invoices, form])

  return (
    <Form.Item
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        fontWeight: 'bold',
        fontSize: 20,
        marginTop: '1rem',
      }}
      name={Operations.Debit}
      initialValue={0}
    >
      <>Сума: {(+total)?.toFixed(2)} {currencyLabel}</>
    </Form.Item>
  )
}

export default PaymentTotal
