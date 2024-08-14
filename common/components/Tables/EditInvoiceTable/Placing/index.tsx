import { ReloadOutlined } from '@ant-design/icons'
import { dateToMonthYear } from '@assets/features/formatDate'
import { usePaymentContext } from '@components/AddPaymentModal'
import {
  InvoiceComponentProps,
  InvoiceType,
} from '@components/Tables/EditInvoiceTable'
import { ServiceType } from '@utils/constants'
import { toArray, toFirstUpperCase, toRoundFixed } from '@utils/helpers'
import validator from '@utils/validator'
import { Button, Flex, Form, Input, Space, Tooltip, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'

export const Name: React.FC<InvoiceComponentProps> = ({
  form,
  name,
  editable,
  disabled,
}) => {
  const { company, service } = usePaymentContext()

  return (
    <Space direction="vertical" size={0}>
      <Typography.Text>Розміщення</Typography.Text>
      {company?.inflicion && (
        <Typography.Text type="secondary" style={{ fontSize: '0.9rem' }}>
          (без врах. інд. інф.)
        </Typography.Text>
      )}
      <Typography.Text type="secondary" style={{ fontSize: '0.75rem' }}>
        {toFirstUpperCase(dateToMonthYear(service?.date))}
      </Typography.Text>
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

  const amount = Form.useWatch(['invoice', ...name, 'amount'], form)
  const price = Form.useWatch(['invoice', ...name, 'price'], form)
  const invoices: InvoiceType[] = Form.useWatch(['invoice'], form)

  const inflicionInvoice: InvoiceType | undefined = useMemo(() => {
    return invoices?.find((invoice) => invoice.type === ServiceType.Inflicion)
  }, [invoices])

  const prevPlacingInvoice = useMemo(() => {
    return prevPayment?.invoice.find(
      (invoice) => invoice.type === ServiceType.Placing
    )
  }, [prevPayment])

  const rentPrice = useMemo(() => {
    return (
      prevPlacingInvoice?.sum ||
      company.totalArea * (company.pricePerMeter || prevService.rentPrice)
    )
  }, [prevPlacingInvoice, company, prevService])

  const isInitial = useMemo(() => {
    return (
      toRoundFixed(price) === toRoundFixed(rentPrice + inflicionInvoice?.sum)
    )
  }, [price, rentPrice, inflicionInvoice])

  if (company?.inflicion && !prevService?.inflicionPrice) {
    return <span>Інфляція за попередній місяць невідома</span>
  }

  if (company?.inflicion) {
    return (
      <Flex justify="space-between" align="center">
        {(editable || (!editable && isInitial)) && (
          <Typography.Text delete={!isInitial}>
            {toRoundFixed(rentPrice)} грн +{' '}
            {toRoundFixed(inflicionInvoice?.sum)} грн
          </Typography.Text>
        )}
        {!isInitial && editable && (
          <Tooltip title="Відновити початкове значення">
            <Button
              onClick={() =>
                form.setFieldValue(
                  ['invoice', ...name, 'price'],
                  +toRoundFixed(rentPrice + inflicionInvoice?.sum)
                )
              }
              icon={<ReloadOutlined />}
            />
          </Tooltip>
        )}
      </Flex>
    )
  }

  if (!editable) {
    return <span>{toRoundFixed(amount)}</span>
  }

  return (
    <Form.Item
      name={[...name, 'amount']}
      rules={[validator.required()]}
      style={{ margin: 0 }}
    >
      <Input
        type="number"
        placeholder="Значення..."
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

  const [changed, setChanged] = useState<boolean>(false)
  const { company, prevPayment } = usePaymentContext()

  const price = Form.useWatch(['invoice', ...name, 'price'], form)
  const invoices: InvoiceType[] = Form.useWatch(['invoice'], form)

  const inflicionInvoice: InvoiceType | undefined = useMemo(() => {
    return invoices?.find((invoice) => invoice.type === ServiceType.Inflicion)
  }, [invoices])

  useEffect(() => {
    if (!company?.inflicion || changed || !editable) {
      return
    }

    const prevPlacingInvoice = prevPayment?.invoice.find(
      (invoice) => invoice.type === ServiceType.Placing
    )

    form.setFieldValue(
      ['invoice', ...name, 'price'],
      +toRoundFixed(inflicionInvoice?.sum + prevPlacingInvoice?.sum)
    )
  }, [form, name, prevPayment, company, inflicionInvoice, changed, editable])

  const suffix = useMemo(() => {
    return company?.inflicion ? (
      <span>грн</span>
    ) : (
      <span>
        грн/м<sup>2</sup>
      </span>
    )
  }, [company])

  if (!editable) {
    return (
      <span>
        {toRoundFixed(price)} {suffix}
      </span>
    )
  }

  return (
    <Form.Item
      name={[...name, 'price']}
      rules={[validator.required()]}
      style={{ margin: 0 }}
    >
      <Input
        type="number"
        placeholder="Значення..."
        disabled={disabled}
        suffix={suffix}
        onChange={() => setChanged(true)}
      />
    </Form.Item>
  )
}

export const Sum: React.FC<InvoiceComponentProps> = ({ form, name: _name }) => {
  const name = useMemo(() => toArray<string>(_name), [_name])

  const { company } = usePaymentContext()

  const price = Form.useWatch(['invoice', ...name, 'price'], form)
  const amount = Form.useWatch(['invoice', ...name, 'amount'], form)
  const sum = Form.useWatch(['invoice', ...name, 'sum'], form)

  useEffect(() => {
    form.setFieldValue(
      ['invoice', ...name, 'sum'],
      company?.inflicion ? +price : +price * +amount
    )
  }, [form, name, price, amount, company])

  return <strong>{toRoundFixed(sum)} грн</strong>
}

const Placing = {
  Name,
  Amount,
  Price,
  Sum,
}

export default Placing
