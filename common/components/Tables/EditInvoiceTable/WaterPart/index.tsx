import { usePaymentContext } from '@components/AddPaymentModal'
import { useInvoiceCurrency } from '@modules/hooks/useInvoiceCurrency'
import { InvoiceComponentProps } from '@components/Tables/EditInvoiceTable'
import { currencyWithUnit, toArray, toRoundFixed } from '@utils/helpers'
import validator from '@utils/validator'
import { Form, Input, Space } from 'antd'
import { useMemo } from 'react'
import { ServiceType } from '@utils/constants'
import InvoiceRowName from '../InvoiceRowName'
import useSyncSum from '../useSyncSum'

export const Name: React.FC<InvoiceComponentProps> = (props) => (
  <InvoiceRowName
    {...props}
    serviceType={ServiceType.WaterPart}
    label="Частка водопостачання"
  />
)

export const Amount: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
}) => {
  const { service, company } = usePaymentContext()
  const currency = useInvoiceCurrency()
  const name = useMemo(() => toArray<string>(_name), [_name])
  const waterPartPrice = +(
    (service?.waterPriceTotal * company?.waterPart) /
    100
  )
  const price = Form.useWatch(['invoice', ...name, 'price'], form)

  if (service?.garbageCollectorPrice && company?.rentPart) {
    return (
      <Space
        direction="horizontal"
        style={{ justifyContent: 'space-between', width: '100%' }}
      >
        <span>
          {toRoundFixed(company.waterPart)}% від{' '}
          {currencyWithUnit(toRoundFixed(service.waterPriceTotal), currency)}{' '}
          ={' '}
        </span>
      </Space>
    )
  }
}

export const Price: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
}) => {
  const name = useMemo(() => toArray<string>(_name), [_name])

  const price = Form.useWatch(['invoice', ...name, 'price'], form)
  const currency = useInvoiceCurrency()

  if (!editable) {
    return <span>{currencyWithUnit(toRoundFixed(price), currency)}</span>
  }

  return (
    <Form.Item name={[...name, 'price']} rules={[validator.required()]} noStyle>
      <Input
        type="number"
        placeholder="Значення..."
        disabled={disabled}
        suffix={currencyWithUnit('', currency)}
      />
    </Form.Item>
  )
}

export const Sum: React.FC<InvoiceComponentProps> = ({ form, name: _name }) => {
  const name = useMemo(() => toArray<string>(_name), [_name])

  const price = Form.useWatch(['invoice', ...name, 'price'], form)
  const sum = Form.useWatch(['invoice', ...name, 'sum'], form)
  const currency = useInvoiceCurrency()

  useSyncSum(form!, name, +price || 0)

  return <strong>{currencyWithUnit(toRoundFixed(sum), currency)}</strong>
}

const WaterPart = {
  Name,
  Amount,
  Price,
  Sum,
}

export default WaterPart
