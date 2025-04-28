import { ReloadOutlined } from '@ant-design/icons'
import { dateToMonthYear } from '@assets/features/formatDate'
import { usePaymentContext } from '@components/AddPaymentModal'
import { InvoiceComponentProps } from '@components/Tables/EditInvoiceTable'
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
  const name = useMemo(() => toArray<string>(_name), [_name]);

  const { company, prevService } = usePaymentContext();

  const [initialPrice, setInitialPrice] = useState<number | null>(null);

  const price = Form.useWatch(['invoice', ...name, 'price'], form);

  const rentPrice = useMemo(() => {
    const { totalArea = 1, pricePerMeter } = company || {};
    const rentPriceValue = pricePerMeter ?? prevService?.rentPrice ?? 0;
    return totalArea * rentPriceValue;
  }, [company, prevService]);

  const inflicion = useMemo(() => {
    return Math.max(prevService?.inflicionPrice - 100, 0);
  }, [prevService]);

  useEffect(() => {
    if (initialPrice === null && price !== undefined) {
      setInitialPrice(price); // <-- зберігаємо price, а не перераховану формулу!
    }
  }, [initialPrice, price]);

  const isInitial = useMemo(() => {
    return toRoundFixed(price) === toRoundFixed(initialPrice);
  }, [price, initialPrice]);

  if (company?.inflicion && prevService?.inflicionPrice) {
    return (
      <Flex justify="space-between" align="center">
        {(editable || (!editable && isInitial)) && (
          <Typography.Text delete={!isInitial}>
            {toRoundFixed(inflicion)}% від {toRoundFixed(rentPrice)} грн
          </Typography.Text>
        )}
        {!isInitial && editable && (
          <Tooltip title="Відновити початкове значення">
            <Button
              onClick={() => {
                if (initialPrice !== null) {
                  form.setFieldValue(['invoice', ...name, 'price'], initialPrice);
                }
              }}
              icon={<ReloadOutlined />}
            />
          </Tooltip>
        )}
      </Flex>
    );
  }

  if (company?.inflicion && !prevService?.inflicionPrice) {
    return <>Інфляція за попередній місяць невідома</>;
  }

  return null;
};


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
