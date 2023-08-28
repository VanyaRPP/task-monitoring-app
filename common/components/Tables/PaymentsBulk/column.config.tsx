import { CloseCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { Popconfirm, Tooltip, Form } from 'antd'

import FormAttribute from '@common/components/UI/FormAttribute'
import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import { useGetAllPaymentsQuery } from '@common/api/paymentApi/payment.api'
import moment from 'moment'

export const getDefaultColumns = (
  service?: any,
  handleDelete?: (row: any) => void
): any[] => [
  {
    fixed: 'left',
    title: 'Компанія',
    dataIndex: 'companyName',
    width: 200,
    render: (value, record) => (
      <FormAttribute
        name={['companies', record.companyName, 'companyName']}
        value={value}
        disabled
      />
    ),
  },
  {
    title: 'Площа (м²)',
    dataIndex: 'totalArea',
    render: (value, record) => (
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
        render: (value, record) => (
          <>
            <FormAttribute
              name={[
                'companies',
                record.companyName,
                'maintenancePrice',
                'price',
              ]}
              value={value || service?.rentPrice}
            />

            {record.servicePricePerMeter && (
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
        render: (__, record) => (
          <ServicePriceSum service={service} record={record} />
        ),
      },
    ],
  },
  {
    title: 'Розміщення',
    children: [
      {
        title: 'За м²',
        dataIndex: 'pricePerMeter',
        render: (value, record) => (
          <FormAttribute
            name={['companies', record.companyName, 'placingPrice', 'price']}
            value={value}
          />
        ),
      },
      {
        title: 'Загальне',
        dataIndex: 'priceSum',
        render: (__, record) => <PricePerMeterSum record={record} />,
      },
    ],
  },
  {
    title: service?.electricityPrice
      ? `Електрика: ${service.electricityPrice} грн/кВт`
      : 'Електрика',
    children: [
      {
        title: 'Стара',
        dataIndex: 'old_elec',
        render: (__, record) => <OldElectricity record={record} />,
      },
      {
        title: 'Нова',
        dataIndex: 'new_elec',
        render: (value, record) => (
          <FormAttribute
            name={[
              'companies',
              record.companyName,
              'electricityPrice',
              'amount',
            ]}
            value={value || 0}
          />
        ),
      },
      {
        title: 'Загальне',
        dataIndex: 'sum_elec',
        render: (__, record) => (
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
        render: (__, record) => <OldWater record={record} />,
      },
      {
        title: 'Нова',
        dataIndex: 'new_water',
        render: (value, record) => (
          <FormAttribute
            name={['companies', record.companyName, 'waterPrice', 'amount']}
            value={value || 0}
          />
        ),
      },
      {
        title: 'Загальне',
        dataIndex: 'sum_water',
        render: (__, record) => (
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
        render: (__, record) => (
          <FormAttribute
            name={['companies', record.companyName, 'waterPart', 'price']}
            value={record.waterPart || 0}
          />
        ),
      },
      {
        title: 'Загальне',
        dataIndex: 'sum_waterPart',
        render: (__, record) => (
          <WaterPartSum service={service} record={record} />
        ),
      },
    ],
  },
  {
    // TODO: треба відобразити індекс інфляції за минулий місяць
    // тайтл також стає компонентом. там ми фетчимо сервіс і тут же відображаємо правильний %
    title: `Індекс інфляції за ${moment(service?.date)
      .subtract(1, 'months')
      .format('MMMM')}`,
    dataIndex: 'inflicionPrice',
    render: (__, record) => (
      <InflicionPrice service={service} record={record} />
    ),
  },
  {
    title: 'ТПВ',
    dataIndex: 'garbageCollector',
    render: (value, record) => (
      <FormAttribute
        name={['companies', record.companyName, 'garbageCollector']}
        value={value || 0}
        disabled
      />
    ),
  },
  {
    title: 'Знижка',
    dataIndex: 'discount',
    render: (value, record) => (
      <FormAttribute
        name={['companies', record.companyName, 'discount']}
        value={value || 0}
      />
    ),
  },
  {
    fixed: 'right',
    align: 'center',
    width: 50,
    render: (_, record: { _id: string }) => (
      <Popconfirm
        title="Видалити запис?"
        onConfirm={() => handleDelete && handleDelete(record._id)}
      >
        <CloseCircleOutlined />
      </Popconfirm>
    ),
  },
]

const InflicionPrice: React.FC<{ service: any; record: any }> = ({
  service,
  record,
}) => {
  const { form } = useInvoicesPaymentContext()

  const rentPrice = Form.useWatch(
    ['companies', record.companyName, 'placingPrice', 'price'],
    form
  )

  // TODO: вивчити формулу. потім ціна оренди береться із суми індексу інфляції і поточної оренди
  // БРАТИ ЦІНУ ОРЕНДИ З МИНУЛОГО ІНВОЙСУ
  // подумати про хелпер з тестами
  const percent = service?.inflicionPrice - 100
  const inflicionAmount = ((rentPrice * percent) / 100).toFixed(2)

  return (
    <FormAttribute
      name={['companies', record.companyName, 'inflicionPrice']}
      value={record.inflicion ? inflicionAmount : 0}
      disabled
    />
  )
}

const OldWater: React.FC<{ record: any }> = ({ record }) => {
  const baseName = ['companies', record.companyName, 'waterPrice']

  const waterPriceName = [...baseName, 'lastAmount']

  const { data: paymentsResponse } = useGetAllPaymentsQuery({
    companyIds: record._id,
    limit: 1,
  })
  const invoice = paymentsResponse?.data?.[0]?.invoice
  const waterPrice = invoice?.find((item) => item.type === 'waterPrice')

  return <FormAttribute name={waterPriceName} value={waterPrice?.amount || 0} />
}

const OldElectricity: React.FC<{ record: any }> = ({ record }) => {
  const baseName = ['companies', record.companyName, 'electricityPrice']

  const electricityPriceName = [...baseName, 'lastAmount']

  const { data: paymentsResponse } = useGetAllPaymentsQuery({
    companyIds: record._id,
    limit: 1,
  })
  const invoice = paymentsResponse?.data?.[0]?.invoice
  const electricityPrice = invoice?.find(
    (item) => item.type === 'electricityPrice'
  )

  return (
    <FormAttribute
      name={electricityPriceName}
      value={electricityPrice?.amount || 0}
    />
  )
}

const PricePerMeterSum: React.FC<{ record: any }> = ({ record }) => {
  const { form } = useInvoicesPaymentContext()

  const baseName = ['companies', record.companyName, 'placingPrice']

  const pricePerMeterName = [...baseName, 'price']

  const pricePerMeter = Form.useWatch(pricePerMeterName, form)

  return (
    <FormAttribute
      disabled
      name={[...baseName, 'sum']}
      value={pricePerMeter * record.totalArea}
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
      value={(waterPart / 100) * service?.waterPriceTotal}
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
      value={newWater ? (newWater - oldWater) * service?.waterPrice : 0}
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
      value={prioPrice * record.totalArea}
    />
  )
}

const ElectricityPriceSum: React.FC<{ service: any; record: any }> = ({
  service,
  record,
}) => {
  const { form } = useInvoicesPaymentContext()

  const baseName = ['companies', record.companyName, 'electricityPrice']

  // TODO: we will get old value from last invoice later
  const newElectricityPriceName = [...baseName, 'amount']
  const oldElectricityPriceName = [...baseName, 'lastAmount']

  const oldElectricityPrice = Form.useWatch(oldElectricityPriceName, form)
  const newElectricityPrice = Form.useWatch(newElectricityPriceName, form)

  return (
    <FormAttribute
      name={[...baseName, 'sum']}
      value={
        newElectricityPrice
          ? (newElectricityPrice - oldElectricityPrice) *
            service?.electricityPrice
          : 0
      }
      disabled
    />
  )
}

const StyledTooltip: React.FC<{
  title: React.ReactNode
}> = ({ title }) => {
  return (
    <Tooltip title={title}>
      <QuestionCircleOutlined
        style={{
          position: 'absolute',
          top: '50%',
          right: 0,
          transform: 'translate(-16px, -50%)',
        }}
      />
    </Tooltip>
  )
}
