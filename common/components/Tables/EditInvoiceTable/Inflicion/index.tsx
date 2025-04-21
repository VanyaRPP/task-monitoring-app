import { ReloadOutlined } from '@ant-design/icons'
import { dateToMonthYear } from '@assets/features/formatDate'
import { usePaymentContext } from '@components/AddPaymentModal'
import { InvoiceComponentProps } from '@components/Tables/EditInvoiceTable'
import { ServiceType } from '@utils/constants'
import { toArray, toFirstUpperCase, toRoundFixed } from '@utils/helpers'
import validator from '@utils/validator'
import { Button, Flex, Form, Input, Space, Tooltip, Typography } from 'antd'
import { useEffect, useMemo, useRef  } from 'react'

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
    <Space direction="vertical" size={0}>
      <Typography.Text>Інфляція</Typography.Text>
      <Typography.Text type="secondary" style={{ fontSize: '0.9rem' }}>
        {price > 0 ? '(донарах. інд. інф.)' : '(незмінна)'}
      </Typography.Text>
      <Typography.Text type="secondary" style={{ fontSize: '0.75rem' }}>
        {toFirstUpperCase(dateToMonthYear(prevService?.date))}
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

  const price = Form.useWatch(['invoice', ...name, 'price'], form)

  const prevPlacingInvoice = useMemo(() => {
    return prevPayment?.invoice.find(
      (invoice) => invoice.type === ServiceType.Placing
    )
  }, [prevPayment])

  const rentPrice = useMemo(() => {
    return (
      prevPlacingInvoice?.sum ||
      company?.totalArea * (company?.pricePerMeter || prevService?.rentPrice)
    )
  }, [prevPlacingInvoice, company, prevService])

  const inflicion = useMemo(() => {
    return Math.max(prevService?.inflicionPrice - 100, 0)
  }, [prevService])


  const initialPriceRef = useRef<number | null>(null)
  const isReadyToCompare = useRef(false)


  useEffect(() => {
    if (!isReadyToCompare.current && !isNaN(price) && price > 0) {
      initialPriceRef.current = price
      isReadyToCompare.current = true
      console.log('[INITIAL SET]', price)
    }
  }, [price])
  

  const isInitial = useMemo(() => {
    if (!isReadyToCompare.current || initialPriceRef.current === null) {
      return true // Ще не можна порівнювати — вважаємо початковим
    }
  
    const current = toRoundFixed(price)
    const initial = toRoundFixed(initialPriceRef.current)
    const equal = current === initial
  
    console.log('[CHECK]', { current, initial, equal })
  
    return equal
  }, [price])
  

  
  

  if (company?.inflicion && prevService?.inflicionPrice) {
    return (
      <Flex justify="space-between" align="center">
        {(editable || (!editable && isInitial)) && (
          <Typography.Text delete={!isInitial}>
            {toRoundFixed(inflicion)}% від {toRoundFixed(rentPrice)} грн
          </Typography.Text>
        )}
        {isReadyToCompare.current && !isInitial && editable && (
  <Tooltip title="Відновити початкове значення">
    <Button
      onClick={() =>
        form.setFieldValue(
          ['invoice', ...name, 'price'],
          initialPriceRef.current
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
