import { ReloadOutlined } from '@ant-design/icons'
import { dateToMonthYear } from '@assets/features/formatDate'
import { usePaymentContext } from '@components/AddPaymentModal'
import { InvoiceComponentProps } from '@components/Tables/EditInvoiceTable'
import { ServiceType } from '@utils/constants'
import { toArray, toFirstUpperCase, toRoundFixed } from '@utils/helpers'
import validator from '@utils/validator'
import {
  Button,
  Flex,
  Form,
  Input,
  Space,
  Tooltip,
  Typography,
  message,
} from 'antd'
import { useEffect, useMemo, useRef } from 'react'

export const Name: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
  record,
}) => {
  const name = useMemo(() => toArray<string>(_name), [_name])
  const price = Form.useWatch(['invoice', ...name, 'price'], form)
  const priceNum = +price || 0

  const { company, prevService, prevPayment } = usePaymentContext()

  const prevPlacingInvoice = useMemo(() => {
    return prevPayment?.invoice.find(
      (invoice) => invoice.type === ServiceType.Placing
    )
  }, [prevPayment])

  const rentPrice = useMemo(() => {
    const fromPrev = prevPlacingInvoice?.sum
    if (typeof fromPrev === 'number') return fromPrev

    const area = company?.totalArea ?? 0
    const ppm = company?.pricePerMeter ?? prevService?.rentPrice ?? 0
    return area * ppm
  }, [
    prevPlacingInvoice,
    company?.totalArea,
    company?.pricePerMeter,
    prevService?.rentPrice,
  ])

  const inflicion = useMemo(() => {
    return Math.max((prevService?.inflicionPrice ?? 0) - 100, 0)
  }, [prevService?.inflicionPrice])

  const calculatedInitialPrice = useMemo(() => {
    return +toRoundFixed((rentPrice / 100) * inflicion)
  }, [rentPrice, inflicion])

  const rowKey = useMemo(
    () => `${record?.type ?? 'unknown'}:${name.join('.')}`,
    [record?.type, name]
  )

  const initialRef = useRef<{
    rowKey: string
    price: any
    ready: boolean
  } | null>(null)

  useEffect(() => {
    initialRef.current = null
  }, [rowKey])

  const canSnapshot = price !== undefined
  if (!initialRef.current) {
    initialRef.current = { rowKey, price, ready: canSnapshot }
  } else if (!initialRef.current.ready && canSnapshot) {
    initialRef.current = { rowKey, price, ready: true }
  }

  const initial = initialRef.current
  const isChanged =
    !!initial?.ready && toRoundFixed(price) !== toRoundFixed(initial.price)

  return (
    <Flex justify="space-between" align="center" gap={12}>
      <Space direction="vertical" size={0}>
        <Typography.Text>Інфляція</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: '0.9rem' }}>
          {priceNum > 0 ? '(донарах. інд. інф.)' : '(незмінна)'}
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: '0.75rem' }}>
          {toFirstUpperCase(dateToMonthYear(prevService?.date))}
        </Typography.Text>
      </Space>

      {editable && isChanged && (
        <Tooltip title="Відновити значення">
          <Button
            disabled={disabled}
            icon={<ReloadOutlined />}
            onClick={() => {
              form.setFieldValue(['invoice', ...name, 'price'], initial.price)
              form.setFieldValue(['invoiceMeta', 'changed'], false)
              message.success('Початкове значення відновлено')
            }}
          />
        </Tooltip>
      )}
    </Flex>
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

  const prevPlacingInvoice = useMemo(() => {
    return prevPayment?.invoice.find(
      (invoice) => invoice.type === ServiceType.Placing
    )
  }, [prevPayment])

  const rentPrice = useMemo(() => {
    const fromPrev = prevPlacingInvoice?.sum
    if (typeof fromPrev === 'number') return fromPrev

    const area = company?.totalArea ?? 0
    const ppm = company?.pricePerMeter ?? prevService?.rentPrice ?? 0
    return area * ppm
  }, [
    prevPlacingInvoice,
    company?.totalArea,
    company?.pricePerMeter,
    prevService?.rentPrice,
  ])

  const inflicion = useMemo(() => {
    return Math.max((prevService?.inflicionPrice ?? 0) - 100, 0)
  }, [prevService?.inflicionPrice])

  const price = Form.useWatch(['invoice', ...name, 'price'], form)
  const calculatedInitialPrice = useMemo(() => {
    return +toRoundFixed((rentPrice / 100) * inflicion)
  }, [rentPrice, inflicion])

  const isInitial = useMemo(() => {
    return toRoundFixed(price) === toRoundFixed(calculatedInitialPrice)
  }, [price, calculatedInitialPrice])

  if (company?.inflicion && prevService?.inflicionPrice) {
    return (
      <Typography.Text delete={!isInitial}>
        {toRoundFixed(inflicion)}% від {toRoundFixed(rentPrice)} грн
      </Typography.Text>
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

  if (!editable) {
    return <span>{toRoundFixed(price)} грн</span>
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
        suffix="грн"
      />
    </Form.Item>
  )
}

export const Sum: React.FC<InvoiceComponentProps> = ({ form, name: _name }) => {
  const name = useMemo(() => toArray<string>(_name), [_name])
  const price = Form.useWatch(['invoice', ...name, 'price'], form)
  const sum = Form.useWatch(['invoice', ...name, 'sum'], form)

  useEffect(() => {
    form.setFieldValue(['invoice', ...name, 'sum'], +price)
  }, [form, name, price])

  return <strong>{toRoundFixed(sum)} грн</strong>
}

const Inflicion = {
  Name,
  Amount,
  Price,
  Sum,
}

export default Inflicion
