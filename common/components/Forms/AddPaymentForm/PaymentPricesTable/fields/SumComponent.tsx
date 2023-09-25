import { usePaymentContext } from '@common/components/AddPaymentModal'
import { ServiceType } from '@utils/constants'
import { useEffect } from 'react'
import { Form } from 'antd'
import s from '../style.module.scss'

export default function SumComponent({ record }) {
  const { form } = usePaymentContext()
  const formFields = Form.useWatch(record.name, form)
  const valueToSet = getVal(record?.name, formFields) || record.sum || 0

  useEffect(() => {
    form.setFieldValue([record.name, 'sum'], valueToSet)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueToSet])

  return (
    <Form.Item name={[record?.name, 'sum']}>
      <h4 className={s.price}>{valueToSet} ₴</h4>
    </Form.Item>
  )
}

const getVal = (record, obj) => {
  switch (record) {
    case ServiceType.Maintenance: {
      const m = obj?.amount * obj?.price
      return +m.toFixed(1) || 0
    }
    case ServiceType.Placing: {
      // TODO: тут теж може бути прикол Індекс інфляції. Фікс прев"ю. Частина 5
      const p =
        obj?.amount === undefined ? +obj?.price : +obj?.amount * +obj?.price
      return p?.toFixed(1) || 0
    }
    case ServiceType.Electricity: {
      const e = (obj?.amount - obj?.lastAmount) * obj?.price
      return +e.toFixed(1) || 0
    }
    case ServiceType.Water: {
      const w = (obj?.amount - obj?.lastAmount) * obj?.price
      return +w.toFixed(1) || 0
    }
    case ServiceType.GarbageCollector: {
      const g =
        obj?.amount === undefined ? obj?.price : obj?.amount * obj?.price
      return (+g || 0).toFixed(1) || 0
    }
    default: {
      return (+obj?.price || 0).toFixed(1) || 0
    }
  }
}
