import { dateToMonthYear } from '@assets/features/formatDate'
import { usePaymentContext } from '@components/AddPaymentModal'
import {
  InvoiceComponentProps,
  InvoiceType,
} from '@components/Tables/EditInvoiceTable'
import { ServiceType } from '@utils/constants'
import { toArray, toFirstUpperCase, toRoundFixed } from '@utils/helpers'
import validator from '@utils/validator'
import { Flex, Form, Input, Space, Tooltip, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import UpdateInvoiceButton from '@components/UI/Buttons/UpdateInvoiceButton/UpdateInvoiceButton'

const usePlacingCalculations = (form: any, name: any) => {
  const { company, prevService, prevPayment } = usePaymentContext()
  const invoices: InvoiceType[] = Form.useWatch(['invoice'], form) || []
  const price = Form.useWatch(['invoice', ...name, 'price'], form)

  const inflicionInvoice = useMemo(() => {
    return invoices?.find((invoice) => invoice.type === ServiceType.Inflicion)
  }, [invoices])

  const prevPlacingInvoice = useMemo(() => {
    return prevPayment?.invoice.find(
      (invoice) => invoice.type === ServiceType.Placing
    )
  }, [prevPayment])

  const amount = Form.useWatch(['invoice', ...name, 'amount'], form)

  const initialAmount = useMemo(() => {
    return (
      prevPlacingInvoice?.amount ??
      company?.totalArea ??
      0
    )
  }, [prevPlacingInvoice, company])

  const rentPrice = useMemo(() => {
    if (typeof prevPlacingInvoice?.sum === 'number') {
      return prevPlacingInvoice.sum
    }
    const area = company?.totalArea ?? 1
    const pricePerMeter = company?.pricePerMeter ?? prevService?.rentPrice ?? 0
    return area * pricePerMeter
  }, [prevPlacingInvoice, company, prevService])

  const initialPricePerMeter = useMemo(() => {
    return (
      prevPlacingInvoice?.price ??
      company?.pricePerMeter ??
      prevService?.rentPrice ??
      0
    )
  }, [prevPlacingInvoice, company, prevService])

  const calculatedInitialPrice = useMemo(() => {
    return +toRoundFixed(rentPrice + (inflicionInvoice?.sum ?? 0))
  }, [rentPrice, inflicionInvoice])

  const isInitial = useMemo(() => {
    const priceInitial =
      toRoundFixed(price) === toRoundFixed(calculatedInitialPrice)

    const amountInitial =
      toRoundFixed(amount) === toRoundFixed(initialAmount)

    return priceInitial && amountInitial
  }, [price, calculatedInitialPrice, amount, initialAmount])

  return {
    company,
    prevService,
    rentPrice,
    inflicionInvoice,
    calculatedInitialPrice,
    initialAmount,
    initialPricePerMeter,
    isInitial,
  }
}
const usePlacingReset = (form: any, name: (string | number)[], calculatedInitialPrice: number) => {
  const price = Form.useWatch(['invoice', ...name, 'price'], form)

  const isInitial = useMemo(() => {
    return toRoundFixed(price) === toRoundFixed(calculatedInitialPrice)
  }, [price, calculatedInitialPrice])

  const resetPrice = () => {
    form.setFieldValue(['invoice', ...name, 'price'], calculatedInitialPrice)
  }

  return {
    isInitial,
    resetPrice,
  }
}

export const Name: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
  editable,
  disabled,
}) => {
  const { company, service } = usePaymentContext()
  const name = useMemo(() => toArray<string>(_name), [_name])
  const [changed, setChanged] = useState<boolean>(false)
  
  const { calculatedInitialPrice, isInitial, initialAmount, initialPricePerMeter } = usePlacingCalculations(form, name)

  return (
    <Flex justify="space-between" align="center">
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
      {editable && !isInitial && (
        <Tooltip title="Відновити початкове значення">
          <UpdateInvoiceButton
            onClick={() => {
              Promise.resolve().then(() => {
                if (company?.inflicion) {
                  form.setFieldValue(
                    ['invoice', ...name, 'price'],
                    calculatedInitialPrice
                  )
                } else {
                  form.setFieldValue(
                    ['invoice', ...name, 'price'],
                    initialPricePerMeter
                  )
                }

                form.setFieldValue(
                  ['invoice', ...name, 'amount'],
                  initialAmount
                )
                setChanged(false)
                form?.setFieldValue(['invoiceMeta', 'changed'], false)
              })
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
  const { company, prevService } = usePaymentContext()
  
  const amount = Form.useWatch(['invoice', ...name, 'amount'], form)
  
  const { rentPrice, inflicionInvoice, isInitial } = usePlacingCalculations(form, name)

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
      </Flex>
    )
  }

  if (!editable) {
    return (
      <span>
        {toRoundFixed(amount)} м<sup>2</sup>
      </span>
    )
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
  const { company } = usePaymentContext()
  const watchedPrice = Form.useWatch(['invoice', ...name, 'price'], form)
  const changed = Form.useWatch(['invoiceMeta', 'changed'], form) ?? false
  
  const { calculatedInitialPrice } = usePlacingCalculations(form, name)

  useEffect(() => {
    if (
      company?.inflicion &&
      editable &&
      !changed &&
      calculatedInitialPrice !== undefined
    ) {
      Promise.resolve().then(() => {
        form?.setFieldValue(
          ['invoice', ...name, 'price'],
          calculatedInitialPrice
        )
      })
    }
  }, [
    company,
    editable,
    changed,
    calculatedInitialPrice,
    form,
    name,
  ])

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
        {toRoundFixed(watchedPrice)} {suffix}
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
        value={watchedPrice}
        onChange={() => {
          form?.setFieldValue(['invoiceMeta', 'changed'], true)
        }}
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
    form?.setFieldValue(
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
