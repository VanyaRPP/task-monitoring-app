import { usePaymentContext } from '@common/components/AddPaymentModal'
import { ServiceType } from '@utils/constants'
import { Form } from 'antd'
import { useEffect } from 'react'
import { Invoice } from '../..'

const Placing: React.FC<{ record: Invoice }> = ({ record }) => {
  const { form } = usePaymentContext()

  const priceName = ['invoice', record.name, 'price']
  const price = Form.useWatch(priceName, form)

  const inflicionName = ['invoice', ServiceType.Inflicion, 'price']
  const inflicion = Form.useWatch(inflicionName, form)

  useEffect(() => {
    form.setFieldValue(['invoice', record.name, 'sum'], +price + +inflicion)
  }, [inflicion, price, form])

  return (
    <Form.Item name={['invoice', record.name, 'sum']}>
      <>{(+price + +inflicion || 0).toFixed(2)} грн</>
    </Form.Item>
  )
}

export default Placing
