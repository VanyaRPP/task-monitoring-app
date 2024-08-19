import { CloseCircleOutlined } from '@ant-design/icons'
import { useGetPaymentsQuery } from '@common/api/paymentApi/payment.api'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import FormAttribute from '@common/components/UI/FormAttribute'
import StyledTooltip from '@common/components/UI/Reusable/StyledTooltip'
import { useCompanyInvoice } from '@common/modules/hooks/usePayment'
import { usePreviousMonthService } from '@common/modules/hooks/useService'
import { Operations, ServiceType } from '@utils/constants'
import { invoiceCoutWater, multiplyFloat, plusFloat } from '@utils/helpers'
import { InflicionIndexTitle } from '@utils/inflicion'
import { getInflicionValue } from '@utils/inflicionHelper'
import { Form, Popconfirm } from 'antd'

export const getDefaultColumns = (
  service?: any,
  handleDelete?: (row: any) => void
): any[] => [
  {
    fixed: 'left',
    title: 'Компанія',
    dataIndex: 'companyName',
    width: 200,
    render: (value: any, record: { companyName: string | number }) => (
      <FormAttribute
        notNum
        name={['companies', record.companyName, 'companyName']}
        value={value}
        disabled
      />
    ),
  },
  {
    title: 'Площа (м²)',
    dataIndex: 'totalArea',
    render: (value: any, record: { companyName: string | number }) => (
      <FormAttribute
        name={['companies', record.companyName, 'totalArea']}
        value={value}
        disabled
      />
    ),
  },
  {
    title: 'Утримання',
    children: [
      {
        title: 'За м²',
        dataIndex: 'servicePricePerMeter',
        render: (
          __,
          record: { companyName: string | number; servicePricePerMeter: any }
        ) => (
          <>
            <FormAttribute
              name={[
                'companies',
                record.companyName,
                'maintenancePrice',
                'price',
              ]}
              value={record.servicePricePerMeter || service?.rentPrice}
              disabled
            />

            {!!record.servicePricePerMeter && (
              <StyledTooltip
                title={'Індивідуальне утримання, що передбачене договором'}
              />
            )}
          </>
        ),
      },
      {
        title: 'Загальне',
        dataIndex: 'servicePriceSum',
        render: (__: any, record: any) => (
          <ServicePriceSum service={service} record={record} />
        ),
      },
    ],
  },
  // TODO: підтянути формулу індексу інфляції з сінгл інвойса
  {
    title: 'Розміщення',
    children: [
      {
        title: 'За м²',
        dataIndex: 'pricePerMeter',
        render: (
          value: any,
          record: { companyName: string | number; inflicion: boolean }
        ) => (
          <FormAttribute
            name={['companies', record.companyName, 'placingPrice', 'price']}
            value={record.inflicion ? 0 : value}
            disabled
          />
        ),
      },
      {
        title: 'Загальне',
        dataIndex: 'priceSum',
        render: (__: any, record: any) => (
          <>
            <PricePlacingField service={service} record={record} />
          </>
        ),
      },
    ],
  },
  {
    title: <InflicionIndexTitleLocal service={service} />,
    dataIndex: 'inflicionPrice',
    render: (__: any, record: any) => (
      <InflicionPrice service={service} record={record} />
    ),
  },
  {
    title: service?.electricityPrice
      ? `Електрика: ${service.electricityPrice} грн/кВт`
      : 'Електрика',
    children: [
      {
        title: 'Стара',
        dataIndex: 'old_elec',
        render: (__: any, record: any) => <OldElectricity record={record} />,
      },
      {
        title: 'Нова',
        dataIndex: 'new_elec',
        render: (value: any, record: { companyName: string | number }) => (
          <FormAttribute
            name={[
              'companies',
              record.companyName,
              'electricityPrice',
              'amount',
            ]}
            value={value}
          />
        ),
      },
      {
        title: 'Загальне',
        dataIndex: 'sum_elec',
        render: (__: any, record: any) => (
          <ElectricityPriceSum service={service} record={record} />
        ),
      },
    ],
  },
  {
    title: service ? `Вода: ${service.waterPrice} грн/м³` : 'Вода',
    children: [
      {
        title: 'Стара',
        dataIndex: 'old_water',
        render: (__: any, record: any) => <OldWater record={record} />,
      },
      {
        title: 'Нова',
        dataIndex: 'new_water',
        render: (
          value: any,
          record: { waterPart: any; companyName: string | number }
        ) => (
          <FormAttribute
            disabled={!!record.waterPart}
            name={['companies', record.companyName, 'waterPrice', 'amount']}
            value={value}
          />
        ),
      },
      {
        title: 'Загальне',
        dataIndex: 'sum_water',
        render: (__: any, record: any) => (
          <WaterPriceSum service={service} record={record} />
        ),
      },
    ],
  },
  {
    title: service ? (
      <>
        Вода (без лічильника)
        <br />
        Всього водопостачання: {service.waterPriceTotal}
      </>
    ) : (
      'Вода (без лічильника)'
    ),
    children: [
      {
        title: 'Частка постачання %',
        dataIndex: 'waterPart',
        render: (
          __: any,
          record: { companyName: string | number; waterPart: any }
        ) => (
          <FormAttribute
            name={['companies', record.companyName, 'waterPart', 'price']}
            value={record.waterPart}
            disabled
          />
        ),
      },
      {
        title: 'Загальне',
        dataIndex: 'sum_waterPart',
        render: (__: any, record: any) => (
          <WaterPartSum service={service} record={record} />
        ),
      },
    ],
  },
  {
    title: service ? (
      <>
        Всього за вивезення ТПВ:
        <br />
        {service.garbageCollectorPrice} грн/м&sup2;{' '}
      </>
    ) : (
      'Вивезення ТПВ'
    ),
    children: [
      {
        title: 'Загальна частка',
        dataIndex: 'garbageCollectorPrice',
        render: (
          __: any,
          record: { companyName: string | number; rentPart: any }
        ) => (
          <FormAttribute
            name={[
              'companies',
              record.companyName,
              'garbageCollector',
              'amount',
            ]}
            value={record?.rentPart}
            disabled
          />
        ),
      },
      {
        title: 'Загальне',
        dataIndex: 'waterPart',
        render: (__: any, record: any) => (
          <GarbageCollectorPrice service={service} record={record} />
        ),
      },
    ],
  },
  {
    title: 'Прибирання',
    dataIndex: 'cleaning',
    render: (value: any, record: { companyName: string | number }) => (
      <FormAttribute
        name={['companies', record.companyName, 'cleaningPrice']}
        value={value}
        disabled
      />
    ),
  },
  {
    title: 'Знижка',
    dataIndex: 'discount',
    render: (value: any, record: { companyName: string | number }) => (
      <FormAttribute
        name={['companies', record.companyName, 'discount']}
        value={value}
      />
    ),
  },
  {
    fixed: 'right',
    align: 'center',
    width: 50,
    render: (_: any, record: { _id: string }) => (
      <Popconfirm
        title="Видалити запис?"
        onConfirm={() => handleDelete && handleDelete(record._id)}
      >
        <CloseCircleOutlined />
      </Popconfirm>
    ),
  },
]

function useInflicionValues({ companyId, company, service }) {
  const { lastInvoice } = useCompanyInvoice({ companyId })
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

const InflicionPrice: React.FC<{ service: any; record: any }> = ({
  service,
  record,
}) => {
  const { inflicionAmount } = useInflicionValues({
    companyId: record._id,
    company: record,
    service,
  })

  return (
    <FormAttribute
      name={['companies', record.companyName, 'inflicionPrice']}
      value={record.inflicion ? inflicionAmount : 0}
      disabled
    />
  )
}

const GarbageCollectorPrice: React.FC<{ service: any; record: any }> = ({
  service,
  record,
}) => {
  const { form } = useInvoicesPaymentContext()
  const rentPart = Form.useWatch(
    ['companies', record.companyName, 'garbageCollector', 'amount'],
    form
  )

  const garbageCollector = multiplyFloat(
    service?.garbageCollectorPrice / 100,
    rentPart
  )

  return (
    <FormAttribute
      name={['companies', record.companyName, 'garbageCollector', 'sum']}
      value={record.garbageCollector ? garbageCollector : 0}
      disabled
    />
  )
}

const OldWater: React.FC<{ record: any }> = ({ record }) => {
  const baseName = ['companies', record.companyName, 'waterPrice']

  const waterPriceName = [...baseName, 'lastAmount']

  const { data: paymentsResponse } = useGetPaymentsQuery({
    companyId: record._id,
    type: Operations.Debit,
    limit: 1,
  })
  const invoice = paymentsResponse?.data?.[0]?.invoice
  const waterPrice = invoice?.find((item) => item.type === 'waterPrice')

  return (
    <FormAttribute
      disabled={!!record.waterPart}
      name={waterPriceName}
      value={waterPrice?.amount}
    />
  )
}

const OldElectricity: React.FC<{ record: any }> = ({ record }) => {
  const baseName = ['companies', record.companyName, 'electricityPrice']

  const electricityPriceName = [...baseName, 'lastAmount']

  const { data: paymentsResponse } = useGetPaymentsQuery({
    companyId: record._id,
    type: Operations.Debit,
    limit: 1,
  })
  const invoice = paymentsResponse?.data?.[0]?.invoice
  const electricityPrice = invoice?.find(
    (item) => item.type === 'electricityPrice'
  )

  return (
    <FormAttribute
      name={electricityPriceName}
      value={electricityPrice?.amount}
    />
  )
}

function PricePlacingField({ service, record }) {
  const baseName = ['companies', record.companyName, 'placingPrice']
  return record?.inflicion ? (
    <InflicionPricePlacingField
      baseName={baseName}
      service={service}
      record={record}
    />
  ) : (
    <PricePerMeterSum baseName={baseName} record={record} />
  )
}

function InflicionPricePlacingField({ baseName, service, record }) {
  const { previousPlacingPrice, inflicionAmount } = useInflicionValues({
    companyId: record._id,
    company: record,
    service,
  })

  return (
    <>
      <FormAttribute
        disabled
        name={[...baseName, 'sum']}
        value={plusFloat(previousPlacingPrice, inflicionAmount)}
      />
      <StyledTooltip
        title={`Значення попереднього місяця + значення інфляції в цьому рахунку (${previousPlacingPrice} + ${inflicionAmount})`}
      />
    </>
  )
}

function PricePerMeterSum({ baseName, record }) {
  const { form } = useInvoicesPaymentContext()

  const pricePerMeterName = [...baseName, 'price']
  const pricePerMeter = Form.useWatch(pricePerMeterName, form)

  return (
    <FormAttribute
      disabled
      name={[...baseName, 'sum']}
      value={multiplyFloat(pricePerMeter, record.totalArea)}
    />
  )
}

const WaterPartSum: React.FC<{ service: any; record: any }> = ({
  service,
  record,
}) => {
  const { form } = useInvoicesPaymentContext()

  const baseName = ['companies', record.companyName, 'waterPart']

  const waterPartName = [...baseName, 'price']

  const waterPart = Form.useWatch(waterPartName, form)

  return (
    <FormAttribute
      disabled
      name={[...baseName, 'sum']}
      value={invoiceCoutWater(waterPart, service)}
    />
  )
}

const WaterPriceSum: React.FC<{ service: any; record: any }> = ({
  service,
  record,
}) => {
  const { form } = useInvoicesPaymentContext()

  const baseName = ['companies', record.companyName, 'waterPrice']

  const oldWaterName = [...baseName, 'lastAmount']
  const newWaterName = [...baseName, 'amount']

  const oldWater = Form.useWatch(oldWaterName, form)
  const newWater = Form.useWatch(newWaterName, form)

  return (
    <FormAttribute
      disabled
      name={[...baseName, 'sum']}
      value={
        newWater ? multiplyFloat(newWater - oldWater, service?.waterPrice) : 0
      }
    />
  )
}

const ServicePriceSum: React.FC<{ service: any; record: any }> = ({
  service,
  record,
}) => {
  const { form } = useInvoicesPaymentContext()

  const baseName = ['companies', record.companyName, 'maintenancePrice']

  const servicePricePerMeterName = [...baseName, 'price']

  const servicePricePerMeter = Form.useWatch(servicePricePerMeterName, form)
  const prioPrice = servicePricePerMeter || service?.rentPrice

  return (
    <FormAttribute
      disabled
      name={[...baseName, 'sum']}
      value={multiplyFloat(prioPrice, record.totalArea)}
    />
  )
}

const ElectricityPriceSum: React.FC<{ service: any; record: any }> = ({
  service,
  record,
}) => {
  const { form } = useInvoicesPaymentContext()

  const baseName = ['companies', record.companyName, 'electricityPrice']

  const newElectricityPriceName = [...baseName, 'amount']
  const oldElectricityPriceName = [...baseName, 'lastAmount']

  const oldElectricityPrice = Form.useWatch(oldElectricityPriceName, form)
  const newElectricityPrice = Form.useWatch(newElectricityPriceName, form)

  return (
    <FormAttribute
      name={[...baseName, 'sum']}
      value={
        newElectricityPrice
          ? multiplyFloat(
              newElectricityPrice - oldElectricityPrice,
              service?.electricityPrice
            )
          : 0
      }
      disabled
    />
  )
}

function InflicionIndexTitleLocal({ service }) {
  const { form } = useInvoicesPaymentContext()
  const { previousMonth } = usePreviousMonthService({
    date: service?.date,
    domainId: form.getFieldValue('domain'),
    streetId: form.getFieldValue('street'),
  })
  return <InflicionIndexTitle previousMonth={previousMonth} />
}
