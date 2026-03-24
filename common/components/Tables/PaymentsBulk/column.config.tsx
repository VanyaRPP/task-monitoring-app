import { CloseCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { usePrevPayment } from './hooks/usePrevPayment/usePrevPayment'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { dateToMonth } from '@common/assets/features/formatDate'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import { ServiceType } from '@utils/constants'
import { inputNumberParser, toRoundFixed } from '@utils/helpers'
import TotalArea from './cells/TotalArea'
import CompanyName from './cells/CompanyName'
import { useInflicionValues } from '@common/components/Tables/PaymentsBulk/hooks/usePrevPayment/useInflicionValues/useInflicionValues'
import validator from '@utils/validator'
import {
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Space,
  TableColumnsType,
  Tooltip,
  Typography,
} from 'antd'
import { useEffect, useMemo } from 'react'

export const getDefaultColumns = (
  remove: (index: number) => void,
  _allowedServices: any,
  losses?: number,
  extraColumns: TableColumnsType = []
): TableColumnsType => [
  {
    fixed: 'left',
    title: 'Компанія',
    width: 250,
    render: (_, { name }: { name: number }) => <CompanyName name={name} />,
  },
  {
    title: 'Площа, м²',
    width: 160,
    render: (_, { name }: { name: number }) => <TotalArea name={name} />,
  },
  _allowedServices.some((inv) => inv?.fieldName === 'rentPrice')
    && {
        title: 'Утримання',
        children: [
          {
            title: 'За м²',
            width: 160,
            render: (_, { name }: { name: number }) => (
              <MaintenancePrice name={name} />
            ),
          },
          {
            title: 'Загальне',
            width: 200,
            render: (_, { name }: { name: number }) => (
              <MaintenanceSum name={name} />
            ),
          },
        ],
      },
  _allowedServices.some((inv) => inv?.fieldName === 'placingPrice')
    && {
        title: 'Розміщення',
        children: [
          {
            title: 'За м²',
            width: 160,
            render: (_, { name }: { name: number }) => (
              <PlacingPrice name={name} />
            ),
          },
          {
            title: 'Загальне',
            width: 200,
            render: (_, { name }: { name: number }) => (
              <PlacingSum name={name} />
            ),
          },
        ],
      },
  _allowedServices.some((inv) => inv?.fieldName === 'inflicionPrice')
    && {
        title: <InflicionTitle />,
        width: 200,
        render: (_, { name }: { name: number }) => <InflicionSum name={name} />,
      },
  _allowedServices.some((inv) => inv?.fieldName === 'electricityPrice')
    && {
        title: losses
          ? `Електропостачання + Втрати ${losses}%`
          : 'Електропостачання',
        children: [
          {
            title: 'Стара',
            width: 160,
            render: (_, { name }: { name: number }) => (
              <ElectricityAmount name={name} last />
            ),
          },
          {
            title: 'Нова',
            width: 160,
            render: (_, { name }: { name: number }) => (
              <ElectricityAmount name={name} />
            ),
          },
          {
            title: 'Втрати',
            width: 200,
            render: (_, { name }: { name: number }) => (
              <LossElectricityPrice name={name} />
            ),
          },
          {
            title: '',
            width: 200,
            render: (_, { name }: { name: number }) => (
              <LossElectricitySum name={name} />
            ),
          },
          {
            title: <ElectricitySumTitle />,
            width: 200,
            render: (_, { name }: { name: number }) => (
              <ElectricitySum name={name} />
            ),
          },
        ],
      },
  _allowedServices.some((inv) => inv?.fieldName === 'waterPrice')
    && {
        title: 'Водопостачання',
        children: [
          {
            title: 'Стара',
            width: 160,
            render: (_, { name }: { name: number }) => (
              <WaterAmount name={name} last />
            ),
          },
          {
            title: 'Нова',
            width: 160,
            render: (_, { name }: { name: number }) => (
              <WaterAmount name={name} />
            ),
          },
          {
            title: <WaterSumTitle />,
            width: 200,
            render: (_, { name }: { name: number }) => <WaterSum name={name} />,
          },
        ],
      },
  _allowedServices.some((inv) => inv?.fieldName === 'waterPartAmount')
    && {
        title: 'Водопостачання без лічильника',
        children: [
          {
            title: 'Частка, %',
            width: 160,
            render: (_, { name }: { name: number }) => (
              <WaterPartAmount name={name} />
            ),
          },
          {
            title: <WaterPartSumTitle />,
            width: 200,
            render: (_, { name }: { name: number }) => (
              <WaterPartSum name={name} />
            ),
          },
        ],
      },
  _allowedServices.some((inv) => inv?.fieldName === 'GarbageCollectorAmount')
    && {
        title: 'Вивіз ТПВ',
        children: [
          {
            title: 'Частка, %',
            width: 160,
            render: (_, { name }: { name: number }) => (
              <GarbageCollectorAmount name={name} />
            ),
          },
          {
            title: <GarbageCollectorSumTitle />,
            width: 200,
            render: (_, { name }: { name: number }) => (
              <GarbageCollectorSum name={name} />
            ),
          },
        ],
      },
  _allowedServices.some((inv) => inv?.fieldName === 'Cleaning')
    && {
        title: 'Прибирання',
        width: 200,
        render: (_, { name }: { name: number }) => <Cleaning name={name} />,
      },
  {
    title: 'Знижка',
    width: 200,
    render: (_, { name }: { name: number }) => <Discount name={name} />,
  },
  ...extraColumns,
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
].filter(Boolean) as TableColumnsType

const LossElectricitySum: React.FC<{ name: number }> = ({ name }) => {
  const { form, service } = useInvoicesPaymentContext()
  const lastAmount: number =
    Form.useWatch(
      ['payments', name, 'invoice', ServiceType.Electricity, 'lastAmount'],
      form
    ) ?? 0
  const amount: number =
    Form.useWatch(
      ['payments', name, 'invoice', ServiceType.Electricity, 'amount'],
      form
    ) ?? 0
  return (
    <Space>
      {service?.losses && amount > 0 && (
        <Typography.Text type="secondary" style={{ fontWeight: 'lighter' }}>
          {(
            amount -
            lastAmount +
            (amount - lastAmount) * (service?.losses / 100)
          ).toFixed(2)}{' '}
          кВт
        </Typography.Text>
      )}
    </Space>
  )
}

const LossElectricityPrice: React.FC<{ name: number }> = ({ name }) => {
  const { form, service } = useInvoicesPaymentContext()
  // const test = Form.useWatch(['service', name], form)
  const lastAmount: number =
    Form.useWatch(
      ['payments', name, 'invoice', ServiceType.Electricity, 'lastAmount'],
      form
    ) ?? 0
  const amount: number =
    Form.useWatch(
      ['payments', name, 'invoice', ServiceType.Electricity, 'amount'],
      form
    ) ?? 0
  return (
    <Space>
      {service?.losses && amount > 0 && (
        <Typography.Text type="secondary" style={{ fontWeight: 'lighter' }}>
          {amount - lastAmount} + ({service?.losses}%)
        </Typography.Text>
      )}
    </Space>
  )
}

const MaintenancePrice: React.FC<{ name: number }> = ({ name }) => {
  const { form } = useInvoicesPaymentContext()

  const servicePricePerMeter: number =
    Form.useWatch(
      ['payments', name, 'company', 'servicePricePerMeter'],
      form
    ) ?? 0

  return (
    <Tooltip
      title={
        !!servicePricePerMeter &&
        'Індивідуальне утримання, що передбачене договором'
      }
    >
      <Form.Item
        name={[name, 'invoice', ServiceType.Maintenance, 'price']}
        style={{ margin: 0 }}
        rules={[validator.required(), validator.min(0)]}
      >
        <InputNumber
          style={{ width: 'auto' }}
          parser={inputNumberParser}
          suffix={!!servicePricePerMeter && <QuestionCircleOutlined />}
        />
      </Form.Item>
    </Tooltip>
  )
}
const MaintenanceSum: React.FC<{ name: number }> = ({ name }) => {
  const { form } = useInvoicesPaymentContext()

  const totalArea: number =
    Form.useWatch(['payments', name, 'company', 'totalArea'], form) ?? 0
  const price: number =
    Form.useWatch(
      ['payments', name, 'invoice', ServiceType.Maintenance, 'price'],
      form
    ) ?? 0

  useEffect(() => {
    form.setFieldValue(
      ['payments', name, 'invoice', ServiceType.Maintenance, 'sum'],
      +toRoundFixed(+totalArea * +price)
    )
  }, [form, name, totalArea, price])

  return (
    <Form.Item
      name={[name, 'invoice', ServiceType.Maintenance, 'sum']}
      style={{ margin: 0 }}
      rules={[validator.required(), validator.min(0)]}
    >
      <Input type="number" disabled />
    </Form.Item>
  )
}

const PlacingPrice: React.FC<{ name: number }> = ({ name }) => {
  const { form } = useInvoicesPaymentContext()

  const inflicion: boolean =
    Form.useWatch(['payments', name, 'company', 'inflicion'], form) ?? false

  return inflicion ? (
    <Tooltip title="Нарахуванян відбувається згідно з ростом інфляції">
      Інфляційне нархування <QuestionCircleOutlined />
    </Tooltip>
  ) : (
    <Form.Item
      name={[name, 'invoice', ServiceType.Placing, 'price']}
      style={{ margin: 0 }}
      rules={[validator.required(), validator.min(0)]}
    >
      <InputNumber parser={inputNumberParser} style={{ width: 'auto' }} />
    </Form.Item>
  )
}
const PlacingSum: React.FC<{ name: number }> = ({ name }) => {
  const { form } = useInvoicesPaymentContext()

  const { previousPlacingPrice, inflicionAmount } = useInflicionValues(name)

  const inflicion: boolean =
    Form.useWatch(['payments', name, 'company', 'inflicion'], form) ?? false
  const totalArea: number =
    Form.useWatch(['payments', name, 'company', 'totalArea'], form) ?? 0
  const price: number =
    Form.useWatch(
      ['payments', name, 'invoice', ServiceType.Placing, 'price'],
      form
    ) ?? 0

  useEffect(() => {
    form.setFieldValue(
      ['payments', name, 'invoice', ServiceType.Placing, 'sum'],
      +toRoundFixed(inflicion ? price : price * totalArea)
    )
  }, [form, name, price, inflicion, totalArea])

  return (
    <Tooltip
      title={
        inflicion &&
        `Значення попереднього місяця + значення інфляції в цьому рахунку (${toRoundFixed(
          previousPlacingPrice
        )} + ${toRoundFixed(inflicionAmount)})`
      }
    >
      <Form.Item
        name={[name, 'invoice', ServiceType.Placing, 'sum']}
        style={{ margin: 0 }}
        rules={[validator.required(), validator.min(0)]}
      >
        <InputNumber
          parser={inputNumberParser}
          suffix={inflicion && <QuestionCircleOutlined />}
          style={{ width: 'auto' }}
          disabled={!inflicion}
        />
      </Form.Item>
    </Tooltip>
  )
}

const InflicionTitle: React.FC = () => {
  const { prevService } = useInvoicesPaymentContext()

  return (
    <Space direction="vertical" size={0}>
      <Typography.Text>Індекс інфляції</Typography.Text>
      {prevService?.inflicionPrice ? (
        <Typography.Text type="secondary" style={{ fontWeight: 'lighter' }}>
          {toRoundFixed(prevService.inflicionPrice)}% за{' '}
          {dateToMonth(prevService.date)}
        </Typography.Text>
      ) : (
        <Typography.Text type="secondary" style={{ fontWeight: 'lighter' }}>
          за {dateToMonth(prevService?.date)} невідомий
        </Typography.Text>
      )}
    </Space>
  )
}
const InflicionSum: React.FC<{ name: number }> = ({ name }) => {
  const { form } = useInvoicesPaymentContext()

  const inflicion: boolean =
    Form.useWatch(['payments', name, 'company', 'inflicion'], form) ?? false
  const price: number =
    Form.useWatch(
      ['payments', name, 'invoice', ServiceType.Inflicion, 'price'],
      form
    ) ?? 0

  useEffect(() => {
    if (inflicion) {
      form.setFieldValue(
        ['payments', name, 'invoice', ServiceType.Inflicion, 'sum'],
        +toRoundFixed(price)
      )
    }
  }, [form, name, price, inflicion])

  if (inflicion) {
    return (
      <Form.Item
        name={[name, 'invoice', ServiceType.Inflicion, 'price']}
        style={{ margin: 0 }}
        rules={[validator.required(), validator.min(0)]}
      >
        <Input type="number" disabled />
      </Form.Item>
    )
  }
}

const ElectricitySumTitle: React.FC = () => {
  const { service } = useInvoicesPaymentContext()

  return (
    <Space>
      <Typography.Text>Загальне</Typography.Text>
      {!!service?.electricityPrice && (
        <Typography.Text type="secondary" style={{ fontWeight: 'lighter' }}>
          {toRoundFixed(service.electricityPrice)} грн/кВт
        </Typography.Text>
      )}
    </Space>
  )
}
const ElectricityAmount: React.FC<{ name: number; last?: boolean }> = ({
  name,
  last = false,
}) => {
  return (
    <Form.Item
      name={[
        name,
        'invoice',
        ServiceType.Electricity,
        last ? 'lastAmount' : 'amount',
      ]}
      style={{ margin: 0 }}
      rules={[validator.required(), validator.min(0)]}
    >
      <InputNumber parser={inputNumberParser} style={{ width: 'auto' }} />
    </Form.Item>
  )
}
const ElectricitySum: React.FC<{ name: number }> = ({ name }) => {
  const { form, service } = useInvoicesPaymentContext()

  const lastAmount: number =
    Form.useWatch(
      ['payments', name, 'invoice', ServiceType.Electricity, 'lastAmount'],
      form
    ) ?? 0
  const amount: number =
    Form.useWatch(
      ['payments', name, 'invoice', ServiceType.Electricity, 'amount'],
      form
    ) ?? 0
  const costAmount = amount - lastAmount
  const loss = costAmount + costAmount * (service?.losses / 100)

  useEffect(() => {
    const price = service?.electricityPrice ?? 0
    const sum =
      service?.losses > 0
        ? +toRoundFixed(loss * +price.toFixed(2))
        : +toRoundFixed((+amount - +lastAmount) * price)

    form.setFieldValue(
      ['payments', name, 'invoice', ServiceType.Electricity, 'sum'],
      sum
    )
  }, [form, name, amount, lastAmount, service])

  return (
    <Form.Item
      name={[name, 'invoice', ServiceType.Electricity, 'sum']}
      style={{ margin: 0 }}
      rules={[validator.required(), validator.min(0)]}
    >
      <Input type="number" disabled />
    </Form.Item>
  )
}

const WaterSumTitle: React.FC = () => {
  const { service } = useInvoicesPaymentContext()

  return (
    <Space>
      <Typography.Text>Загальне</Typography.Text>
      {!!service?.waterPrice && (
        <Typography.Text type="secondary" style={{ fontWeight: 'lighter' }}>
          {toRoundFixed(service.waterPrice)} грн/м<sup>3</sup>
        </Typography.Text>
      )}
    </Space>
  )
}
const WaterAmount: React.FC<{ name: number; last?: boolean }> = ({
  name,
  last = false,
}) => {
  const { form } = useInvoicesPaymentContext()

  const waterPart: number =
    Form.useWatch(['payments', name, 'company', 'waterPart'], form) ?? 0

  if (!waterPart) {
    return (
      <Form.Item
        name={[
          name,
          'invoice',
          ServiceType.Water,
          last ? 'lastAmount' : 'amount',
        ]}
        style={{ margin: 0 }}
        rules={[validator.required(), validator.min(0)]}
      >
        <InputNumber parser={inputNumberParser} />
      </Form.Item>
    )
  }
}
const WaterSum: React.FC<{ name: number }> = ({ name }) => {
  const { form, service } = useInvoicesPaymentContext()

  const lastAmount: number =
    Form.useWatch(
      ['payments', name, 'invoice', ServiceType.Water, 'lastAmount'],
      form
    ) ?? 0
  const amount: number =
    Form.useWatch(
      ['payments', name, 'invoice', ServiceType.Water, 'amount'],
      form
    ) ?? 0

  const waterPart: number =
    Form.useWatch(['payments', name, 'company', 'waterPart'], form) ?? 0

  useEffect(() => {
    if (!waterPart) {
      const price = service?.waterPrice ?? 0
      const sum = +toRoundFixed((+amount - +lastAmount) * price)

      form.setFieldValue(
        ['payments', name, 'invoice', ServiceType.Water, 'sum'],
        sum
      )
    }
  }, [form, name, amount, lastAmount, service, waterPart])

  if (!waterPart) {
    return (
      <Form.Item
        name={[name, 'invoice', ServiceType.Water, 'sum']}
        style={{ margin: 0 }}
        rules={[validator.required(), validator.min(0)]}
      >
        <Input type="number" disabled />
      </Form.Item>
    )
  }
}

const WaterPartSumTitle: React.FC = () => {
  const { service } = useInvoicesPaymentContext()

  return (
    <Space>
      <Typography.Text>Загальне</Typography.Text>
      {!!service?.waterPrice && (
        <Typography.Text type="secondary" style={{ fontWeight: 'lighter' }}>
          {toRoundFixed(service.waterPriceTotal)} грн
        </Typography.Text>
      )}
    </Space>
  )
}
const WaterPartAmount: React.FC<{ name: number }> = ({ name }) => {
  const { form } = useInvoicesPaymentContext()

  const waterPart: number =
    Form.useWatch(['payments', name, 'company', 'waterPart'], form) ?? 0

  if (waterPart) {
    return (
      <Form.Item
        name={[name, 'company', 'waterPart']}
        style={{ margin: 0 }}
        rules={[validator.required(), validator.min(0)]}
      >
        <Input type="number" disabled />
      </Form.Item>
    )
  }
}
const WaterPartSum: React.FC<{ name: number }> = ({ name }) => {
  const { form } = useInvoicesPaymentContext()

  const waterPart: number =
    Form.useWatch(['payments', name, 'company', 'waterPart'], form) ?? 0

  const price: number =
    Form.useWatch(
      ['payments', name, 'invoice', ServiceType.WaterPart, 'price'],
      form
    ) ?? 0

  useEffect(() => {
    if (waterPart) {
      const sum = +toRoundFixed(price ?? 0)
      form.setFieldValue(
        ['payments', name, 'invoice', ServiceType.WaterPart, 'sum'],
        sum
      )
    }
  }, [form, name, price, waterPart])

  if (waterPart) {
    return (
      <Form.Item
        name={[name, 'invoice', ServiceType.WaterPart, 'price']}
        style={{ margin: 0 }}
        rules={[validator.required(), validator.min(0)]}
      >
        <InputNumber parser={inputNumberParser} />
      </Form.Item>
    )
  }
}

const GarbageCollectorSumTitle: React.FC = () => {
  const { service } = useInvoicesPaymentContext()

  return (
    <Space>
      <Typography.Text>Загальне</Typography.Text>
      {!!service?.waterPrice && (
        <Typography.Text type="secondary" style={{ fontWeight: 'lighter' }}>
          {toRoundFixed(service.garbageCollectorPrice)} грн
        </Typography.Text>
      )}
    </Space>
  )
}
const GarbageCollectorAmount: React.FC<{ name: number }> = ({ name }) => {
  const { form } = useInvoicesPaymentContext()

  const garbageCollector: boolean =
    Form.useWatch(['payments', name, 'company', 'garbageCollector'], form) ??
    false

  if (garbageCollector) {
    return (
      <Form.Item
        name={[name, 'company', 'rentPart']}
        style={{ margin: 0 }}
        rules={[validator.required(), validator.min(0)]}
      >
        <Input type="number" disabled />
      </Form.Item>
    )
  }
}
const GarbageCollectorSum: React.FC<{ name: number }> = ({ name }) => {
  const { form } = useInvoicesPaymentContext()

  const garbageCollector: boolean =
    Form.useWatch(['payments', name, 'company', 'garbageCollector'], form) ??
    false

  const price: number =
    Form.useWatch(
      ['payments', name, 'invoice', ServiceType.GarbageCollector, 'price'],
      form
    ) ?? 0

  useEffect(() => {
    if (garbageCollector) {
      const sum = +toRoundFixed(price ?? 0)
      form.setFieldValue(
        ['payments', name, 'invoice', ServiceType.GarbageCollector, 'sum'],
        sum
      )
    }
  }, [form, name, price, garbageCollector])

  if (garbageCollector) {
    return (
      <Form.Item
        name={[name, 'invoice', ServiceType.GarbageCollector, 'price']}
        style={{ margin: 0 }}
        rules={[validator.required(), validator.min(0)]}
      >
        <InputNumber parser={inputNumberParser} />
      </Form.Item>
    )
  }
}

const Cleaning: React.FC<{ name: number }> = ({ name }) => {
  const { form } = useInvoicesPaymentContext()

  const cleaning: boolean =
    Form.useWatch(['payments', name, 'company', 'cleaning'], form) ?? false

  const price: number =
    Form.useWatch(
      ['payments', name, 'invoice', ServiceType.Cleaning, 'price'],
      form
    ) ?? 0

  useEffect(() => {
    if (cleaning) {
      const sum = +toRoundFixed(price ?? 0)
      form.setFieldValue(
        ['payments', name, 'invoice', ServiceType.Cleaning, 'sum'],
        sum
      )
    }
  }, [form, name, price, cleaning])

  if (cleaning) {
    return (
      <Form.Item
        name={[name, 'invoice', ServiceType.Cleaning, 'price']}
        style={{ margin: 0 }}
        rules={[validator.required(), validator.min(0)]}
      >
        <InputNumber parser={inputNumberParser} style={{ width: 'auto' }} />
      </Form.Item>
    )
  }
}

const Discount: React.FC<{ name: number }> = ({ name }) => {
  const { form } = useInvoicesPaymentContext()

  const price: number =
    Form.useWatch(
      ['payments', name, 'invoice', ServiceType.Discount, 'price'],
      form
    ) ?? 0

  useEffect(() => {
    const sum = +toRoundFixed(price ?? 0)
    form.setFieldValue(
      ['payments', name, 'invoice', ServiceType.Discount, 'sum'],
      sum
    )
  }, [form, name, price])

  return (
    <Form.Item
      name={[name, 'invoice', ServiceType.Discount, 'price']}
      style={{ margin: 0 }}
      rules={[validator.required(), validator.max(0)]}
    >
      <InputNumber parser={inputNumberParser} style={{ width: 'auto' }} />
    </Form.Item>
  )
}
