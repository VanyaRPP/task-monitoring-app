import { CloseCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { IExtendedRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import { useCompanyInvoice } from '@common/modules/hooks/usePayment'
import { usePreviousMonthService } from '@common/modules/hooks/useService'
import { Operations, ServiceType } from '@utils/constants'
import { multiplyFloat, toRoundFixed } from '@utils/helpers'
import { getInflicionValue } from '@utils/inflicionHelper'
import { Form, Input, Popconfirm, TableColumnsType, Tooltip } from 'antd'
import { useEffect, useMemo } from 'react'

export const getDefaultColumns = (
  remove: (index: number) => void
): TableColumnsType => [
  {
    fixed: 'left',
    title: 'Компанія',
    dataIndex: 'companyName',
    width: 250,
    render: (_, { name }: { name: number }) => <CompanyName name={name} />,
  },
  {
    title: 'Площа, м²',
    width: 150,
    render: (_, { name }: { name: number }) => <TotalArea name={name} />,
  },
  {
    title: 'Утримання',
    children: [
      {
        title: 'За м²',
        width: 150,
        render: (_, { name }: { name: number }) => (
          <MaintenancePrice name={name} />
        ),
      },
      {
        title: 'Загальне',
        width: 150,
        render: (_, { name }: { name: number }) => (
          <MaintenanceSum name={name} />
        ),
      },
    ],
  },
  {
    title: 'Розміщення',
    children: [
      {
        title: 'За м²',
        width: 150,
        render: (_, { name }: { name: number }) => <PlacingPrice name={name} />,
      },
      {
        title: 'Загальне',
        width: 150,
        render: (_, { name }: { name: number }) => <PlacingSum name={name} />,
      },
    ],
  },
  {
    title: 'Індекс інфляції (TODO: smart title tooltip)',
    dataIndex: 'inflicionPrice',
    width: 150,
    render: (_, { name }: { name: number }) => <InflicionSum name={name} />,
  },
  {
    title: 'Електрика (TODO: smart title)',
    children: [
      {
        title: 'Стара',
        width: 150,
        render: (_, { name }: { name: number }) => (
          <ElectricityAmount name={name} last />
        ),
      },
      {
        title: 'Нова',
        width: 150,
        render: (_, { name }: { name: number }) => (
          <ElectricityAmount name={name} />
        ),
      },
      {
        title: 'Загальне',
        width: 150,
        render: (_, { name }: { name: number }) => (
          <ElectricitySum name={name} />
        ),
      },
    ],
  },
  {
    title: 'Вода (TODO: smart title)',
    children: [
      {
        title: 'Стара',
        width: 150,
        render: (_, { name }: { name: number }) => (
          <WaterAmount name={name} last />
        ),
      },
      {
        title: 'Нова',
        width: 150,
        render: (_, { name }: { name: number }) => <WaterAmount name={name} />,
      },
      {
        title: 'Загальне',
        width: 150,
        render: (_, { name }: { name: number }) => <WaterSum name={name} />,
      },
    ],
  },
  {
    title: 'Вода (без лічильника) (TODO: smart title)',
    children: [
      {
        title: 'Частка, %',
        width: 150,
        render: (_, { name }: { name: number }) => (
          <WaterPartAmount name={name} />
        ),
      },
      {
        title: 'Загальне',
        width: 150,
        render: (_, { name }: { name: number }) => <WaterPartSum name={name} />,
      },
    ],
  },
  {
    title: 'Вивезення ТПВ (TODO: smart title)',
    children: [
      {
        title: 'Частка, %',
        width: 150,
        render: (_, { name }: { name: number }) => (
          <GarbageCollectorAmount name={name} />
        ),
      },
      {
        title: 'Загальне',
        width: 150,
        render: (_, { name }: { name: number }) => (
          <GarbageCollectorSum name={name} />
        ),
      },
    ],
  },
  {
    title: 'Прибирання',
    width: 150,
    render: (_, { name }: { name: number }) => <Cleaning name={name} />,
  },
  {
    title: 'Знижка',
    width: 150,
    render: (_, { name }: { name: number }) => <Discount name={name} />,
  },
  {
    fixed: 'right',
    align: 'center',
    width: 48,
    render: (_, { name }: { name: number }) => (
      <Popconfirm
        title="Ви впевнені, що хочете видалити запис?"
        okText="Так"
        cancelText="Ні"
        onConfirm={() => remove(name)}
      >
        <CloseCircleOutlined />
      </Popconfirm>
    ),
  },
]

const useFormFieldData = (
  name: number
): {
  company?: IExtendedRealestate
  service?: IService
} => {
  const { form, service } = useInvoicesPaymentContext()

  const company = Form.useWatch(['companies', name], form)

  return { company, service }
}

const useInflicionValues = (
  name: number
): {
  previousPlacingPrice: number
  inflicionAmount: number
} => {
  const { company, service } = useFormFieldData(name)
  const { lastInvoice } = useCompanyInvoice({ companyId: company?._id })
  const { form } = useInvoicesPaymentContext()
  const { previousMonth } = usePreviousMonthService({
    date: service?.date,
    domainId: form.getFieldValue('domain'),
    streetId: form.getFieldValue('street'),
  })
  const previousPlacingPrice = lastInvoice?.invoice?.find(
    (item) => item.type === ServiceType.Placing
  )?.sum

  const value =
    previousPlacingPrice ||
    (company?.totalArea &&
      company?.pricePerMeter &&
      multiplyFloat(company?.totalArea, company?.pricePerMeter))

  const inflicionAmount = +getInflicionValue(
    value,
    previousMonth?.inflicionPrice
  )
  return { previousPlacingPrice: value, inflicionAmount }
}

const CompanyName: React.FC<{ name: number }> = ({ name }) => {
  return (
    <Form.Item name={[name, 'companyName']} style={{ margin: 0 }}>
      <Input disabled />
    </Form.Item>
  )
}

const TotalArea: React.FC<{ name: number }> = ({ name }) => {
  return (
    <Form.Item name={[name, 'totalArea']} style={{ margin: 0 }}>
      <Input disabled />
    </Form.Item>
  )
}

const MaintenancePrice: React.FC<{ name: number }> = ({ name }) => {
  const { form } = useInvoicesPaymentContext()

  const { company, service } = useFormFieldData(name)

  useEffect(() => {
    form.setFieldValue(
      ['companies', name, 'invoice', ServiceType.Maintenance, 'price'],
      (+company?.servicePricePerMeter || +service?.rentPrice) ?? 0
    )
  }, [form, name, company, service])

  return (
    <Tooltip
      title={
        !!company?.servicePricePerMeter &&
        'Індивідуальне утримання, що передбачене договором'
      }
      destroyTooltipOnHide
    >
      <Form.Item
        name={[name, 'invoice', ServiceType.Maintenance, 'price']}
        style={{ margin: 0 }}
      >
        <Input
          disabled
          suffix={!!company?.servicePricePerMeter && <QuestionCircleOutlined />}
        />
      </Form.Item>
    </Tooltip>
  )
}
const MaintenanceSum: React.FC<{ name: number }> = ({ name }) => {
  const { form } = useInvoicesPaymentContext()

  const amount: number =
    Form.useWatch(['companies', name, 'totalArea'], form) ?? 0
  const price: number =
    Form.useWatch([
      'companies',
      name,
      'invoice',
      ServiceType.Maintenance,
      'price',
    ]) ?? 0

  useEffect(() => {
    form.setFieldValue(
      ['companies', name, 'invoice', ServiceType.Maintenance, 'sum'],
      +toRoundFixed(+amount * +price)
    )
  }, [form, name, amount, price])

  return (
    <Form.Item
      name={[name, 'invoice', ServiceType.Maintenance, 'sum']}
      style={{ margin: 0 }}
    >
      <Input disabled />
    </Form.Item>
  )
}

const PlacingPrice: React.FC<{ name: number }> = ({ name }) => {
  const { form } = useInvoicesPaymentContext()

  const { company } = useFormFieldData(name)

  useEffect(() => {
    if (!company?.inflicion) {
      form.setFieldValue(
        ['companies', name, 'invoice', ServiceType.Placing, 'price'],
        +company?.pricePerMeter ?? 0
      )
    }
  }, [form, name, company])

  return company?.inflicion ? (
    <Tooltip title="TODO: explaination">
      Інфляційне нархування <QuestionCircleOutlined />
    </Tooltip>
  ) : (
    <Form.Item
      name={[name, 'invoice', ServiceType.Placing, 'price']}
      style={{ margin: 0 }}
    >
      <Input disabled />
    </Form.Item>
  )
}
const PlacingSum: React.FC<{ name: number }> = ({ name }) => {
  const { form } = useInvoicesPaymentContext()

  const { company } = useFormFieldData(name)

  const { previousPlacingPrice, inflicionAmount } = useInflicionValues(name)

  const amount: number =
    Form.useWatch(['companies', name, 'totalArea'], form) ?? 0
  const price: number =
    Form.useWatch([
      'companies',
      name,
      'invoice',
      ServiceType.Placing,
      'price',
    ]) ?? 0

  useEffect(() => {
    form.setFieldValue(
      ['companies', name, 'invoice', ServiceType.Placing, 'sum'],
      +toRoundFixed(
        company?.inflicion
          ? +inflicionAmount + +previousPlacingPrice
          : +amount * +price
      )
    )
  }, [
    form,
    name,
    company,
    amount,
    price,
    previousPlacingPrice,
    inflicionAmount,
  ])

  return (
    <Tooltip
      title={
        company?.inflicion &&
        `Значення попереднього місяця + значення інфляції в цьому рахунку (${previousPlacingPrice} + ${inflicionAmount})`
      }
    >
      <Form.Item
        name={[name, 'invoice', ServiceType.Placing, 'sum']}
        style={{ margin: 0 }}
      >
        <Input
          disabled
          suffix={company?.inflicion && <QuestionCircleOutlined />}
        />
      </Form.Item>
    </Tooltip>
  )
}

const InflicionSum: React.FC<{ name: number }> = ({ name }) => {
  const { form } = useInvoicesPaymentContext()

  const { company } = useFormFieldData(name)

  const { inflicionAmount } = useInflicionValues(name)

  useEffect(() => {
    form.setFieldValue(
      ['companies', name, 'invoice', ServiceType.Inflicion, 'sum'],
      +toRoundFixed(company?.inflicion ? +inflicionAmount : 0)
    )
  }, [form, name, company, inflicionAmount])

  return (
    <Form.Item
      name={[name, 'invoice', ServiceType.Inflicion, 'sum']}
      style={{ margin: 0 }}
    >
      <Input disabled />
    </Form.Item>
  )
}

const ElectricityAmount: React.FC<{ name: number; last?: boolean }> = ({
  name,
  last = false,
}) => {
  const { form } = useInvoicesPaymentContext()

  const { company } = useFormFieldData(name)

  const {
    data: {
      data: {
        0: { invoice: prevInvoices },
      },
    } = { data: { 0: { invoice: [] } } },
  } = useGetAllPaymentsQuery(
    {
      companyIds: [company?._id],
      type: Operations.Debit,
      limit: 1,
    },
    { skip: !last }
  )

  const prevInvoice = useMemo(() => {
    return prevInvoices.find(({ type }) => type === ServiceType.Electricity)
  }, [prevInvoices])

  // TODO: fix useEffect order
  // parent component useEffect with `form.setFieldsValue({ companies })`
  // executes after this one and rewrites new initialValues for field
  useEffect(() => {
    form.setFieldValue(
      [
        'companies',
        name,
        'invoice',
        ServiceType.Electricity,
        last ? 'lastAmount' : 'amount',
      ],
      prevInvoice ? prevInvoice.amount : 0
    )
  }, [form, name, last, prevInvoice])

  return (
    <Form.Item
      name={[
        name,
        'invoice',
        ServiceType.Electricity,
        last ? 'lastAmount' : 'amount',
      ]}
      style={{ margin: 0 }}
    >
      <Input />
    </Form.Item>
  )
}
const ElectricitySum: React.FC<{ name: number }> = ({ name }) => {
  const { form } = useInvoicesPaymentContext()

  const { service } = useFormFieldData(name)

  const lastAmount: number =
    Form.useWatch([
      'companies',
      name,
      'invoice',
      ServiceType.Electricity,
      'lastAmount',
    ]) ?? 0
  const amount: number =
    Form.useWatch([
      'companies',
      name,
      'invoice',
      ServiceType.Electricity,
      'amount',
    ]) ?? 0

  useEffect(() => {
    form.setFieldValue(
      ['companies', name, 'invoice', ServiceType.Electricity, 'sum'],
      +toRoundFixed((+amount - +lastAmount) * (+service?.electricityPrice ?? 0))
    )
  }, [form, name, amount, lastAmount, service])

  return (
    <Form.Item
      name={[name, 'invoice', ServiceType.Electricity, 'sum']}
      style={{ margin: 0 }}
    >
      <Input disabled />
    </Form.Item>
  )
}

const WaterAmount: React.FC<{ name: number; last?: boolean }> = ({
  name,
  last = false,
}) => {
  const { form } = useInvoicesPaymentContext()

  const { company } = useFormFieldData(name)

  const {
    data: {
      data: {
        0: { invoice: prevInvoices },
      },
    } = { data: { 0: { invoice: [] } } },
  } = useGetAllPaymentsQuery(
    {
      companyIds: [company?._id],
      type: Operations.Debit,
      limit: 1,
    },
    { skip: !last }
  )

  const prevInvoice = useMemo(() => {
    return prevInvoices.find(({ type }) => type === ServiceType.Water)
  }, [prevInvoices])

  // TODO: fix useEffect order
  // parent component useEffect with `form.setFieldsValue({ companies })`
  // executes after this one and rewrites new initialValues for field
  useEffect(() => {
    form.setFieldValue(
      [
        'companies',
        name,
        'invoice',
        ServiceType.Water,
        last ? 'lastAmount' : 'amount',
      ],
      prevInvoice ? prevInvoice.amount : 0
    )
  }, [form, name, last, prevInvoice])

  return (
    <Form.Item
      name={[
        name,
        'invoice',
        ServiceType.Water,
        last ? 'lastAmount' : 'amount',
      ]}
      style={{ margin: 0 }}
    >
      <Input />
    </Form.Item>
  )
}
const WaterSum: React.FC<{ name: number }> = ({ name }) => {
  const { form } = useInvoicesPaymentContext()

  const { service } = useFormFieldData(name)

  const lastAmount: number =
    Form.useWatch([
      'companies',
      name,
      'invoice',
      ServiceType.Water,
      'lastAmount',
    ]) ?? 0
  const amount: number =
    Form.useWatch([
      'companies',
      name,
      'invoice',
      ServiceType.Water,
      'amount',
    ]) ?? 0

  useEffect(() => {
    form.setFieldValue(
      ['companies', name, 'invoice', ServiceType.Water, 'sum'],
      +toRoundFixed((+amount - +lastAmount) * (+service?.waterPrice ?? 0))
    )
  }, [form, name, amount, lastAmount, service])

  return (
    <Form.Item
      name={[name, 'invoice', ServiceType.Water, 'sum']}
      style={{ margin: 0 }}
    >
      <Input disabled />
    </Form.Item>
  )
}

const WaterPartAmount: React.FC<{ name: number }> = ({ name }) => {
  return (
    <Form.Item name={[name, 'waterPart']} style={{ margin: 0 }}>
      <Input disabled />
    </Form.Item>
  )
}
const WaterPartSum: React.FC<{ name: number }> = ({ name }) => {
  const { form } = useInvoicesPaymentContext()
  const { company, service } = useFormFieldData(name)

  useEffect(() => {
    form.setFieldValue(
      ['companies', name, 'invoice', ServiceType.WaterPart, 'sum'],
      +toRoundFixed((company?.waterPart / 100) * service?.waterPriceTotal) ?? 0
    )
  }, [form, name, company, service])

  return (
    <Form.Item
      name={[name, 'invoice', ServiceType.WaterPart, 'sum']}
      style={{ margin: 0 }}
    >
      <Input />
    </Form.Item>
  )
}

const GarbageCollectorAmount: React.FC<{ name: number }> = ({ name }) => {
  return (
    <Form.Item name={[name, 'rentPart']} style={{ margin: 0 }}>
      <Input disabled />
    </Form.Item>
  )
}
const GarbageCollectorSum: React.FC<{ name: number }> = ({ name }) => {
  const { form } = useInvoicesPaymentContext()

  const { company, service } = useFormFieldData(name)

  useEffect(() => {
    form.setFieldValue(
      ['companies', name, 'invoice', ServiceType.GarbageCollector, 'sum'],
      +toRoundFixed(
        (service?.garbageCollectorPrice / 100) * company?.rentPart
      ) ?? 0
    )
  }, [form, name, company, service])

  return (
    <Form.Item
      name={[name, 'invoice', ServiceType.GarbageCollector, 'sum']}
      style={{ margin: 0 }}
    >
      <Input />
    </Form.Item>
  )
}

const Cleaning: React.FC<{ name: number }> = ({ name }) => {
  return (
    <Form.Item name={[name, 'cleaning']} style={{ margin: 0 }}>
      <Input />
    </Form.Item>
  )
}

const Discount: React.FC<{ name: number }> = ({ name }) => {
  return (
    <Form.Item name={[name, 'discount']} style={{ margin: 0 }}>
      <Input />
    </Form.Item>
  )
}
