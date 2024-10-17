import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { ServiceType } from '@utils/constants'
import { toArray } from '@utils/helpers'
import { Form, FormInstance, Select, Table } from 'antd'
import React, { useCallback, useMemo } from 'react'

import Cleaning from './Cleaning'
import Custom from './Custom'
import Discount from './Discount'
import Electricity from './Electricity'
import GarbageCollector from './GarbageCollector'
import Inflicion from './Inflicion'
import Maintenance from './Maintenance'
import Placing from './Placing'
import Water from './Water'
import WaterPart from './WaterPart'

export interface TableProps {
  form?: FormInstance

  editable?: boolean
  disabled?: boolean

  extended?: boolean
  expandable?: boolean
  filterable?: boolean
  selectable?: boolean

  loading?: boolean

  selected?: string[]
  onSelect?: (items: string[]) => void
  onDelete?: (item: string) => void

  className?: string
  style?: React.CSSProperties
}

export type EditInvoicesTableProps = Omit<
  TableProps,
  'filterable' | 'extended' | 'expandable'
>
export type InvoiceType = IPayment['invoice'][0]

export const EditInvoicesTable_unstable: React.FC<EditInvoicesTableProps> = ({
  form: _form,
  selected: _selected = [],
  onSelect,
  onDelete,
  editable = false,
  disabled = false,
  loading = false,
  selectable = false,
  ...props
}) => {
  const [form] = Form.useForm(_form)

  const invoices: InvoiceType[] | undefined = Form.useWatch('invoice', form)

  return (
    <Form.List name="invoice">
      {(fields, { add, remove }) => (
        <Table
          rowKey="name"
          loading={loading}
          size="small"
          dataSource={fields.filter((field) => form.getFieldValue(['invoice', field.name, 'sum']) !== 0)}
          pagination={false}
          footer={
            editable
              ? () => (
                  <InvoiceSelector
                    exclude={invoices?.map(({ type }) => type as ServiceType)}
                    onSelect={(value) => add({ type: value })}
                  />
                )
              : null
          }
          scroll={{ x: 750 }}
          columns={[
            {
              title: '№',
              width: 50,
              render: (_, __, index) => index + 1,
            },
            {
              title: 'Назва',
              width: 400,
              render: (_, { name }: { name: number }) => (
                <Name
                  form={form}
                  name={name}
                  editable={editable}
                  disabled={disabled}
                />
              ),
            },
            {
              title: 'Кількість',
              width: 500,
              render: (_, { name }: { name: number }) => (
                <Amount
                  form={form}
                  name={name}
                  editable={editable}
                  disabled={disabled}
                />
              ),
            },
            {
              title: 'Ціна',
              width: 250,
              render: (_, { name }: { name: number }) => (
                <Price
                  form={form}
                  name={name}
                  editable={editable}
                  disabled={disabled}
                />
              ),
            },
            {
              title: 'Сума',
              width: 200,
              render: (_, { name }: { name: number }) => (
                <Sum
                  form={form}
                  name={name}
                  editable={editable}
                  disabled={disabled}
                />
              ),
            },
            {
              width: 50,
              render: (_, record: { name: number }) => (
                <MinusCircleOutlined
                  onClick={() => !disabled && remove(record.name)}
                  style={{ opacity: disabled ? 0.5 : 1 }}
                />
              ),
              hidden: !editable,
            },
          ].filter((column) => !column.hidden)}
          {...props}
        />
      )}
    </Form.List>
  )
}

export const InvoiceSelector: React.FC<{
  exclude?: ServiceType[]
  onSelect?: (value: ServiceType) => void
}> = ({ exclude, onSelect }) => {
  const handleSelect = useCallback(
    (value: ServiceType) => {
      if (value === ServiceType.Custom || !exclude?.includes(value)) {
        onSelect(value)
      }
    },
    [exclude, onSelect]
  )

  const options = useMemo(() => {
    return [
      {
        value: ServiceType.Maintenance,
        label: 'Утримання',
      },
      {
        value: ServiceType.Placing,
        label: 'Розміщення',
      },
      {
        value: ServiceType.Inflicion,
        label: 'Інфляція',
      },
      {
        value: ServiceType.GarbageCollector,
        label: 'Вивіз ТПВ',
      },
      {
        value: ServiceType.Electricity,
        label: 'Електропостачання',
      },
      {
        value: ServiceType.Water,
        label: 'Водопостачання',
      },
      {
        value: ServiceType.WaterPart,
        label: 'Частка водопостачання',
      },
      {
        value: ServiceType.Cleaning,
        label: 'Прибирання',
      },
      {
        value: ServiceType.Discount,
        label: 'Знижка',
      },
      {
        value: ServiceType.Custom,
        label: 'Власне',
      },
    ].filter(
      ({ value }) => value === ServiceType.Custom || !exclude?.includes(value)
    )
  }, [exclude])

  return (
    <Select
      style={{ width: '100%' }}
      suffixIcon={<PlusOutlined />}
      placeholder="Додати поле..."
      onSelect={handleSelect}
      value={null}
      options={options}
    />
  )
}

export interface InvoiceComponentProps {
  form?: FormInstance
  name?: string | string | number | number[]
  editable?: boolean
  disabled?: boolean
}

const Name: React.FC<InvoiceComponentProps> = (props) => {
  return <Component type="name" {...props} />
}
const Amount: React.FC<InvoiceComponentProps> = (props) => {
  return <Component type="amount" {...props} />
}
const Price: React.FC<InvoiceComponentProps> = (props) => {
  return <Component type="price" {...props} />
}
const Sum: React.FC<InvoiceComponentProps> = (props) => {
  return <Component type="sum" {...props} />
}

const ComponentsCollection: {
  [key in ServiceType | string]: {
    Name: React.FC<InvoiceComponentProps>
    Amount: React.FC<InvoiceComponentProps>
    Price: React.FC<InvoiceComponentProps>
    Sum: React.FC<InvoiceComponentProps>
  }
} = {
  [ServiceType.Maintenance]: Maintenance,
  [ServiceType.Placing]: Placing,
  [ServiceType.Inflicion]: Inflicion,
  [ServiceType.GarbageCollector]: GarbageCollector,
  [ServiceType.Electricity]: Electricity,
  [ServiceType.Water]: Water,
  [ServiceType.WaterPart]: WaterPart,
  [ServiceType.Cleaning]: Cleaning,
  [ServiceType.Discount]: Discount,
  [ServiceType.Custom]: Custom,
}

const Component: React.FC<
  InvoiceComponentProps & {
    type: 'name' | 'amount' | 'price' | 'sum'
  }
> = ({ form, name, type, ...props }) => {
  const record = Form.useWatch(['invoice', ...toArray<string>(name)], form)

  if (!record) {
    return
  }

  const components =
    ComponentsCollection[record.type] ||
    ComponentsCollection[ServiceType.Custom]

  if (!components) {
    return
  }

  const Component =
    type === 'name'
      ? components.Name
      : type === 'amount'
      ? components.Amount
      : type === 'price'
      ? components.Price
      : type === 'sum'
      ? components.Sum
      : null

  if (!Component) {
    return
  }

  return <Component form={form} name={name} {...props} />
}
