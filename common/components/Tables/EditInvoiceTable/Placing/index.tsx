import { ReloadOutlined } from '@ant-design/icons'
import { dateToMonthYear } from '@assets/features/formatDate'
import { usePaymentContext } from '@components/AddPaymentModal'
import { InvoiceComponentProps, InvoiceType } from '@components/Tables/EditInvoiceTable'
import { ServiceType } from '@utils/constants'
import { toArray, toFirstUpperCase, toRoundFixed } from '@utils/helpers'
import validator from '@utils/validator'
import { Button, Flex, Form, Input, Space, Tooltip, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'

export const Name: React.FC<InvoiceComponentProps> = ({
  form,
  name: _name,
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
  const { company, prevService, prevPayment } = usePaymentContext();

  const [snapshotPrice, setSnapshotPrice] = useState<number | null>(null);
  const [changed, setChanged] = useState<boolean>(false);

  const invoices: InvoiceType[] = Form.useWatch(['invoice'], form)
  const amount = Form.useWatch(['invoice', ...name, 'amount'], form);
  const price = Form.useWatch(['invoice', ...name, 'price'], form);

  const inflicionInvoice = useMemo(() => {
    return invoices?.find((invoice) => invoice.type === ServiceType.Inflicion)
  }, [invoices])

  const prevPlacingInvoice = useMemo(() => {
    return prevPayment?.invoice.find((invoice) => invoice.type === ServiceType.Placing);
  }, [prevPayment])

  const rentPrice = useMemo(() => {
    if (typeof prevPlacingInvoice?.sum === 'number') {
      return prevPlacingInvoice.sum
    }
    const area = company?.totalArea ?? 1
    const pricePerMeter = company?.pricePerMeter ?? prevService?.rentPrice ?? 0
    return area * pricePerMeter
  }, [prevPlacingInvoice, company, prevService])

  const calculatedInitialPrice = useMemo(() => {
    return +toRoundFixed(rentPrice + (inflicionInvoice?.sum ?? 0));
  }, [rentPrice, inflicionInvoice]);

  useEffect(() => {
    setChanged(false);
    if (snapshotPrice === null && !isNaN(calculatedInitialPrice) && calculatedInitialPrice !== 0) {
      setSnapshotPrice(calculatedInitialPrice);
    }
  }, [form]);

  useEffect(() => {
    if (
      snapshotPrice === null &&
      company?.inflicion &&
      inflicionInvoice?.sum !== undefined &&
      !isNaN(calculatedInitialPrice)
    ) {
      Promise.resolve().then(() => {
        setSnapshotPrice((prev) => prev ?? calculatedInitialPrice);
        if (!changed) {
          form.setFieldValue(['invoice', ...name, 'price'], calculatedInitialPrice);
        }
      });
    }
  }, [snapshotPrice, company, inflicionInvoice, calculatedInitialPrice, changed, form, name]);

  const isInitial = useMemo(() => {
    if (price === undefined || snapshotPrice === null) {
      return true;
    }
    return toRoundFixed(price) === toRoundFixed(snapshotPrice);
  }, [price, snapshotPrice]);

  if (company?.inflicion && !prevService?.inflicionPrice) {
    return <span>Інфляція за попередній місяць невідома</span>
  }

  if (company?.inflicion) {
    return (
      <Flex justify="space-between" align="center">
        {(editable || (!editable && isInitial)) && (
          <Typography.Text delete={!isInitial}>
            {toRoundFixed(rentPrice)} грн + {toRoundFixed(inflicionInvoice?.sum)} грн
          </Typography.Text>
        )}
        {editable && snapshotPrice !== null && !isInitial && (
          <Tooltip title="Відновити початкове значення">
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                Promise.resolve().then(() => {
                  form.setFieldValue(['invoice', ...name, 'price'], calculatedInitialPrice);
                  setSnapshotPrice(calculatedInitialPrice);
                  setChanged(false);
                  form.setFieldValue(['invoiceMeta', 'changed'], false);
                });
              }}
            />
          </Tooltip>
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
  const { company, prevService } = usePaymentContext();
  const invoices: InvoiceType[] = Form.useWatch(['invoice'], form)
  const watchedPrice = Form.useWatch(['invoice', ...name, 'price'], form);
  const changed = Form.useWatch(['invoiceMeta', 'changed'], form) ?? false;

  const inflicionInvoice = useMemo(() => {
    return invoices?.find((invoice) => invoice.type === ServiceType.Inflicion)
  }, [invoices])

  const calculatedPrevPlacingSum = useMemo(() => {
    const area = company?.totalArea ?? 0
    const pricePerMeter = company?.pricePerMeter ?? prevService?.rentPrice ?? 0;
    return area * pricePerMeter
  }, [company, prevService]);

  const calculatedTotal = useMemo(() => {
    return +toRoundFixed(calculatedPrevPlacingSum + (inflicionInvoice?.sum ?? 0));
  }, [calculatedPrevPlacingSum, inflicionInvoice]);

  useEffect(() => {
    if (
      company?.inflicion &&
      editable &&
      !changed &&
      inflicionInvoice?.sum !== undefined
    ) {
      Promise.resolve().then(() => {
        form.setFieldValue(['invoice', ...name, 'price'], calculatedTotal);
      });
    }
  }, [company, editable, changed, inflicionInvoice?.sum, calculatedTotal, form, name]);

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
    <Form.Item name={[...name, 'price']} rules={[validator.required()]} style={{ margin: 0 }}>
      <Input
        type="number"
        placeholder="Значення..."
        disabled={disabled}
        suffix={suffix}
        value={watchedPrice}
        onChange={() => {
          form.setFieldValue(['invoiceMeta', 'changed'], true);
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
