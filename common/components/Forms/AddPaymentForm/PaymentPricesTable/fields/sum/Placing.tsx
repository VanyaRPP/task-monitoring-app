import { usePaymentContext } from '@common/components/AddPaymentModal'
import { ServiceType } from '@utils/constants'
import { Form } from 'antd'
import { useEffect } from 'react'
import { Invoice } from '../..'

// TODO: case without inflicion
const Placing: React.FC<{
  record: Invoice
}> = ({ record }) => {
  const { form } = usePaymentContext()

  const { price, sum } = record

  const invoice = Form.useWatch('invoice', form)

  useEffect(() => {
    const inflicionInvoice = invoice?.find(
      (inv: Invoice) => inv.type === ServiceType.Inflicion
    )
    const inflicion = inflicionInvoice?.sum || 0

    form.setFieldValue(['invoice', record.key, 'sum'], +price + +inflicion || 0)
  }, [form, price, invoice])

  return <Form.Item>{(+sum || 0).toFixed(2)} грн</Form.Item>
}

export default Placing
