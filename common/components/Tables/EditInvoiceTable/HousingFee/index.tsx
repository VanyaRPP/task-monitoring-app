import { usePaymentContext } from '@components/AddPaymentModal'
import { useInvoiceCurrency } from '@modules/hooks/useInvoiceCurrency'
import { InvoiceComponentProps } from '@components/Tables/EditInvoiceTable'
import { resolveTypedServiceTariff } from '@common/components/Tables/PaymentsBulk/invoice/typedServiceTariff'
import { currencyWithUnit, toArray, toRoundFixed } from '@utils/helpers'
import validator from '@utils/validator'
import { Form, Input } from 'antd'
import { useEffect, useMemo } from 'react'
import { ServiceType } from '@utils/constants'
import InvoiceRowName from '../InvoiceRowName'
import useSyncSum from '../useSyncSum'

/**
 * Квартплата: м² × тариф, як Розміщення в Payment Bulk, але без інфляції.
 *
 * Рядки, створені з розрахунку заборгованості, несуть лише суму (price = sum,
 * без площі) - для них сума лишається ціною, як у Розміщення без площі.
 */
const hasArea = (amount: unknown): boolean =>
  !isNaN(+(amount as number)) && +(amount as number) > 0

export const Name: React.FC<InvoiceComponentProps> = (props) => (
  <InvoiceRowName
    {...props}
    serviceType={ServiceType.HousingFee}
    label="Квартплата"
  />
)

export const Amount: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  record,
  editable,
  disabled,
}) => {
  const name = useMemo(() => toArray<string>(_name), [_name])
  const { company, service } = usePaymentContext()

  const amount = Form.useWatch(['invoice', ...name, 'amount'], form)

  // A row just picked from the catalog has neither area nor tariff: seed both
  // from the company, the same sources Payment Bulk uses.
  useEffect(() => {
    if (!editable || !form) return
    const row = form.getFieldValue(['invoice', ...name])
    if (!row || row.amount != null || row.price != null) return

    form.setFieldValue(
      ['invoice', ...name, 'amount'],
      +toRoundFixed(company?.totalArea) || undefined
    )
    form.setFieldValue(
      ['invoice', ...name, 'price'],
      resolveTypedServiceTariff(
        { company, service },
        {
          serviceId: String(record?.serviceId ?? ''),
          fieldName: record?.fieldName,
        }
      ) || undefined
    )
  }, [editable, form, name, company, service, record])

  if (!editable) {
    return hasArea(amount) ? (
      <span>
        {toRoundFixed(amount)} м<sup>2</sup>
      </span>
    ) : null
  }

  return (
    <Form.Item
      name={[...name, 'amount']}
      rules={[validator.min(0)]}
      style={{ margin: 0 }}
    >
      <Input
        type="number"
        placeholder="Площа..."
        disabled={disabled}
        suffix={
          <span>
            м<sup>2</sup>
          </span>
        }
      />
    </Form.Item>
  )
}

export const Price: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
}) => {
  const name = useMemo(() => toArray<string>(_name), [_name])

  const price = Form.useWatch(['invoice', ...name, 'price'], form)
  const amount = Form.useWatch(['invoice', ...name, 'amount'], form)
  const currency = useInvoiceCurrency()

  const unit = hasArea(amount) ? (
    <span>
      {currencyWithUnit('', currency)}/м<sup>2</sup>
    </span>
  ) : (
    <span>{currencyWithUnit('', currency)}</span>
  )

  if (!editable) {
    return (
      <span>
        {toRoundFixed(price)} {unit}
      </span>
    )
  }

  return (
    <Form.Item
      name={[...name, 'price']}
      rules={[validator.required(), validator.min(0)]}
      style={{ margin: 0 }}
    >
      <Input
        type="number"
        placeholder="Значення..."
        disabled={disabled}
        suffix={unit}
      />
    </Form.Item>
  )
}

export const Sum: React.FC<InvoiceComponentProps> = ({ form, name: _name }) => {
  const name = useMemo(() => toArray<string>(_name), [_name])

  const price = Form.useWatch(['invoice', ...name, 'price'], form)
  const amount = Form.useWatch(['invoice', ...name, 'amount'], form)
  const sum = Form.useWatch(['invoice', ...name, 'sum'], form)
  const currency = useInvoiceCurrency()

  useSyncSum(
    form!,
    name,
    hasArea(amount) ? (+price || 0) * +amount : +price || 0
  )

  return <strong>{currencyWithUnit(toRoundFixed(sum), currency)}</strong>
}

const HousingFee = {
  Name,
  Amount,
  Price,
  Sum,
}

export default HousingFee
