import { usePaymentContext } from '@common/components/AddPaymentModal'
import { Invoice } from '@common/components/Forms/AddPaymentForm/PaymentPricesTable'
import { Form } from 'antd'
import { useEffect } from 'react'

export const SumComponent: React.FC<{ record: Invoice }> = ({ record }) => {
  const baseName = ['invoice', record.type]
  const { form } = usePaymentContext()

  const lastAmount = Form.useWatch([...baseName, 'lastAmount'], form)
  const amount = Form.useWatch([...baseName, 'amount'], form)
  const price = Form.useWatch([...baseName, 'price'], form)

  const amountDiff =
    !amount && !lastAmount ? 1 : lastAmount ? amount - lastAmount : amount

  useEffect(() => {
    form.setFieldValue([...baseName, 'sum'], amountDiff * price)
  }, [amountDiff, price, form, record.type])

  return (
    <Form.Item name={[...baseName, 'sum']}>
      <>{(amountDiff * price || 0).toFixed(2)} грн</>
    </Form.Item>
  )
}

// const getVal = (record, obj) => {
//   switch (record) {
//     case ServiceType.Maintenance: {
//       const m = obj?.amount * obj?.price
//       return +m.toFixed(1) || 0
//     }
//     case ServiceType.Placing: {
//       // TODO: тут теж може бути прикол Індекс інфляції. Фікс прев"ю. Частина 5
//       const p = obj?.amount === undefined ? +obj?.price : +obj?.amount * +obj?.price
//       return p?.toFixed(1) || 0
//     }
//     case ServiceType.Electricity: {
//       const e = (obj?.amount - obj?.lastAmount) * obj?.price
//       return +e.toFixed(1) || 0
//     }
//     case ServiceType.Water: {
//       const w = obj?.amount === undefined ? obj?.price : (obj?.amount - obj?.lastAmount) * obj?.price
//       return (+w || 0).toFixed(1)|| 0
//     }
//     case ServiceType.WaterPart: {
//       const w = obj?.amount === undefined ? obj?.price : (obj?.amount - obj?.lastAmount) * obj?.price
//       return (+w || 0).toFixed(1)|| 0
//     }
//     case ServiceType.GarbageCollector: {
//       const g =
//         obj?.amount === undefined ? obj?.price : obj?.amount * obj?.price
//       return (+g || 0).toFixed(1) || 0
//     }
//     default: {
//       return (+obj?.price || 0).toFixed(1) || 0
//     }
//   }
// }
