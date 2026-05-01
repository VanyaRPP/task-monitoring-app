import { ReloadOutlined } from '@ant-design/icons'
import { dateToMonthYear } from '@assets/features/formatDate'
import { usePaymentContext } from '@components/AddPaymentModal'
import { InvoiceComponentProps } from '@components/Tables/EditInvoiceTable'
import { ServiceType } from '@utils/constants'
import { currencyWithUnit, toArray, toFirstUpperCase, toRoundFixed } from '@utils/helpers'
import validator from '@utils/validator'
import { Button, Flex, Form, Input, Space, Tooltip, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import UpdateInvoiceButton from '../UpdateInvoiceButton'

export const Name: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
}) => {
  const name = useMemo(() => toArray<string>(_name), [_name])

  const price = Form.useWatch(['invoice', ...name, 'price'], form)

  const { prevService } = usePaymentContext()

  return (
    <Space
      direction="horizontal"
      style={{ justifyContent: 'space-between', width: '100%' }}
    >
      <Space direction="vertical" size={0}>
        <Typography.Text>Інфляція</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: '0.9rem' }}>
          {price > 0 ? '(донарах. інд. інф.)' : '(незмінна)'}
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: '0.75rem' }}>
          {toFirstUpperCase(dateToMonthYear(prevService?.date))}
        </Typography.Text>
      </Space>
      {editable && (
        <UpdateInvoiceButton
          form={form!}
          name={name}
          serviceType={ServiceType.Inflicion}
          disabled={disabled}
        />
      )}
    </Space>
  )
}

export const Amount: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
}) => {
  const name = useMemo(() => toArray<string>(_name), [_name])

  const { company, prevService, prevPayment } = usePaymentContext()

  const [initialPrice, setInitialPrice] = useState<number | null>(null)
  const prevPlacingInvoice = useMemo(() => {
    return prevPayment?.invoice.find(
      (invoice) => invoice.type === ServiceType.Placing
    )
  }, [prevPayment])

  const price = Form.useWatch(['invoice', ...name, 'price'], form)

  const rentPrice = useMemo(() => {
    return (
      prevPlacingInvoice?.sum ||
      company?.totalArea * (company?.pricePerMeter || prevService?.rentPrice)
    )
  }, [prevPlacingInvoice, company, prevService])

  const inflicion = useMemo(() => {
    return Math.max(prevService?.inflicionPrice - 100, 0)
  }, [prevService])

  useEffect(() => {
    if (initialPrice === null && price !== undefined) {
      setInitialPrice(price)
    }
  }, [initialPrice, price])

  const isInitial = useMemo(() => {
    return toRoundFixed(price) === toRoundFixed((rentPrice / 100) * inflicion)
  }, [price, rentPrice, inflicion])

  if (company?.inflicion && prevService?.inflicionPrice) {
    return (
      <Flex justify="space-between" align="center">
        {(editable || (!editable && isInitial)) && (
          <Typography.Text delete={!isInitial}>
            {toRoundFixed(inflicion)}% від {currencyWithUnit(toRoundFixed(rentPrice), company)}
          </Typography.Text>
        )}
        {!isInitial && editable && (
          <Tooltip title="Відновити початкове значення">
            <Button
              onClick={() =>
                form.setFieldValue(
                  ['invoice', ...name, 'price'],
                  +toRoundFixed((rentPrice / 100) * inflicion)
                )
              }
              icon={<ReloadOutlined />}
            />
          </Tooltip>
        )}
      </Flex>
    )
  }

  if (company?.inflicion && !prevService?.inflicionPrice) {
    return <>Інфляція за попередній місяць невідома</>
  }

  return null
}

export const Price: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
}) => {
  const name = useMemo(() => toArray<string>(_name), [_name])

  const price = Form.useWatch(['invoice', ...name, 'price'], form)
  const { company } = usePaymentContext()

  if (!editable) {
    return <span>{currencyWithUnit(toRoundFixed(price), company)}</span>
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
        suffix={currencyWithUnit('', company)}
      />
    </Form.Item>
  )
}

export const Sum: React.FC<InvoiceComponentProps> = ({ form, name: _name }) => {
  const name = useMemo(() => toArray<string>(_name), [_name])

  const price = Form.useWatch(['invoice', ...name, 'price'], form)
  const sum = Form.useWatch(['invoice', ...name, 'sum'], form)
  const { company } = usePaymentContext()

  useEffect(() => {
    form.setFieldValue(['invoice', ...name, 'sum'], +price || 0)
  }, [form, name, price])

  return <strong>{currencyWithUnit(toRoundFixed(sum), company)}</strong>
}

const Inflicion = {
  Name,
  Amount,
  Price,
  Sum,
}

export default Inflicion
