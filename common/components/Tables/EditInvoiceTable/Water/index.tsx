import { useInvoiceCurrency } from '@modules/hooks/useInvoiceCurrency'
import { InvoiceComponentProps } from '@components/Tables/EditInvoiceTable'
import { DividedSpace } from '@components/UI/DividedSpace'
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
    serviceType={ServiceType.Water}
    label="Водопостачання"
  />
)

export const Amount: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
}) => {
  const name = useMemo(() => toArray<string>(_name), [_name])

  const lastAmount = Form.useWatch(['invoice', ...name, 'lastAmount'], form)
  const amount = Form.useWatch(['invoice', ...name, 'amount'], form)

  if (!editable) {
    return (
      <DividedSpace>
        <span>
          {toRoundFixed(lastAmount)} м<sup>3</sup>
        </span>
        <span>
          {toRoundFixed(amount)} м<sup>3</sup>
        </span>
      </DividedSpace>
    )
  }

  return (
    <Space>
      <Form.Item
        name={[...name, 'lastAmount']}
        rules={[validator.required(), validator.min(0)]}
        noStyle
      >
        <Input
          type="number"
          placeholder="Значення..."
          disabled={disabled}
          suffix={
            <span>
              м<sup>3</sup>
            </span>
          }
          style={{ width: 140 }}
        />
      </Form.Item>
      <Form.Item
        name={[...name, 'amount']}
        rules={[validator.required(), validator.min(0)]}
        noStyle
      >
        <Input
          type="number"
          placeholder="Значення..."
          disabled={disabled}
          suffix={
            <span>
              м<sup>3</sup>
            </span>
          }
          style={{ width: 140 }}
        />
      </Form.Item>
    </Space>
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
  const currency = useInvoiceCurrency()

  if (!editable) {
    return (
      <span>
        {toRoundFixed(price)} {currencyWithUnit('', currency)}
      </span>
    )
  }

  return (
    <Form.Item name={[...name, 'price']} rules={[validator.required()]} noStyle>
      <Input
        type="number"
        placeholder="Значення..."
        disabled={disabled}
        suffix={
          <>
            {currencyWithUnit('', currency)}/м<sup>3</sup>
          </>
        }
      />
    </Form.Item>
  )
}

export const Sum: React.FC<InvoiceComponentProps> = ({ form, name: _name }) => {
  const name = useMemo(() => toArray<string>(_name), [_name])

  const lastAmount = Form.useWatch(['invoice', ...name, 'lastAmount'], form)
  const amount = Form.useWatch(['invoice', ...name, 'amount'], form)
  const price = Form.useWatch(['invoice', ...name, 'price'], form)
  const sum = Form.useWatch(['invoice', ...name, 'sum'], form)
  const currency = useInvoiceCurrency()

  useSyncSum(form!, name, Math.max(+amount - +lastAmount, 0) * +price)

  return <strong>{currencyWithUnit(toRoundFixed(sum), currency)}</strong>
}

const Water = {
  Name,
  Amount,
  Price,
  Sum,
}

export default Water
