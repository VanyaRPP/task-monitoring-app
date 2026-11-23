import { useEffect } from 'react'
import { Form, InputNumber, Tooltip } from 'antd'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import { ServiceType } from '@utils/constants'
import { inputNumberParser, toRoundFixed } from '@utils/helpers'
import validator from '@utils/validator'
import { useInflicionValues } from '@components/Tables/PaymentsBulk/hooks/useInflicionValues/useInflicionValues'
import { QuestionCircleOutlined } from '@ant-design/icons'

// Ключ рядка інвойсу, який читають/пишуть ці комірки. За замовчуванням —
// нативне Розміщення; per-domain копія передає свій ключ (її _id).
type Keyed = { name: number; fieldName?: string }

/**
 * Чи індексується цей рядок інфляцією.
 *
 * Тільки нативне Розміщення: getInflicionInvoice індексує саме його суму, і
 * лише один такий рядок може бути в рахунку. Per-domain копія — звичайне
 * «м² × тариф», як і решта типізованих кастомних послуг.
 */
const useIndexedByInflicion = (name: number, fieldName: string): boolean => {
  const { form } = useInvoicesPaymentContext()
  const inflicion: boolean =
    Form.useWatch(['payments', name, 'company', 'inflicion'], form) ?? false

  return fieldName === ServiceType.Placing && inflicion
}

export const PlacingSum: React.FC<Keyed> = ({
  name,
  fieldName = ServiceType.Placing,
}) => {
  const { form } = useInvoicesPaymentContext()

  const { previousPlacingPrice, inflicionAmount } = useInflicionValues(name)

  const indexed = useIndexedByInflicion(name, fieldName)
  const totalArea: number =
    Form.useWatch(['payments', name, 'company', 'totalArea'], form) ?? 0
  const price: number =
    Form.useWatch(['payments', name, 'invoice', fieldName, 'price'], form) ?? 0

  useEffect(() => {
    form.setFieldValue(
      ['payments', name, 'invoice', fieldName, 'sum'],
      +toRoundFixed(indexed ? price : price * totalArea)
    )
  }, [form, name, fieldName, price, indexed, totalArea])

  return (
    <Tooltip
      title={
        indexed &&
        `Значення попереднього місяця + значення інфляції в цьому рахунку (${toRoundFixed(
          previousPlacingPrice
        )} + ${toRoundFixed(inflicionAmount)})`
      }
    >
      <Form.Item
        name={[name, 'invoice', fieldName, 'sum']}
        style={{ margin: 0 }}
        rules={[validator.required(), validator.min(0)]}
      >
        <InputNumber
          parser={inputNumberParser}
          suffix={indexed && <QuestionCircleOutlined />}
          style={{ width: 'auto' }}
          disabled={!indexed}
        />
      </Form.Item>
    </Tooltip>
  )
}

export const PlacingPrice: React.FC<Keyed> = ({
  name,
  fieldName = ServiceType.Placing,
}) => {
  const indexed = useIndexedByInflicion(name, fieldName)

  return indexed ? (
    <Tooltip title="Нарахуванян відбувається згідно з ростом інфляції">
      Інфляційне нархування <QuestionCircleOutlined />
    </Tooltip>
  ) : (
    <Form.Item
      name={[name, 'invoice', fieldName, 'price']}
      style={{ margin: 0 }}
      rules={[validator.required(), validator.min(0)]}
    >
      <InputNumber parser={inputNumberParser} style={{ width: 'auto' }} />
    </Form.Item>
  )
}
