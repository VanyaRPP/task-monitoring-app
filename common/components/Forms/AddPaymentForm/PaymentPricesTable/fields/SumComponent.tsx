import { usePaymentContext } from '@common/components/AddPaymentModal'
import { Invoice } from '@common/components/Forms/AddPaymentForm/PaymentPricesTable'
import { Form } from 'antd'

export const SumComponent: React.FC<{ record: Invoice }> = ({ record }) => {
  const { form } = usePaymentContext()

  const amount = Form.useWatch([record.name, 'amount'], form)
  const price = Form.useWatch([record.name, 'price'], form)

  return <Form.Item name={[record.name, 'sum']}>{amount * price}грн</Form.Item>
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
