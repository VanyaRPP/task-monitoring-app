import { CloseCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { Popconfirm, Tooltip } from 'antd'

import { useInvoicesPaymentContext } from '@common/components/DashboardPage/blocks/paymentsBulk'
import FormAttribute from '@common/components/UI/FormAttribute'

export const getDefaultColumns = (
  service?: any,
  handleDelete?: (row: any) => void,
  handleChange?: (...args: any) => void
): any[] => {
  const { form } = useInvoicesPaymentContext()

  return [
    {
      fixed: 'left',
      title: 'Компанія',
      dataIndex: 'companyName',
      width: 200,
      render: (value, record) => (
        <FormAttribute
          form={form}
          name={['companies', record.companyName, 'companyName']}
          value={value}
        />
      ),
    },
    {
      title: 'Площа (м²)',
      dataIndex: 'totalArea',
      render: (value, record) => (
        <FormAttribute
          form={form}
          name={['companies', record.companyName, 'totalArea']}
          value={value}
        />
      ),
    },
    {
      title: 'Утримання',
      children: [
        {
          title: (
            <>
              За м²
              <Tooltip title="Індивідуальне утримання, що передбачене договором">
                <QuestionCircleOutlined style={{ marginLeft: 8 }} />
              </Tooltip>
            </>
          ),
          dataIndex: 'servicePricePerMeter',
          render: (value, record) => (
            <FormAttribute
              form={form}
              editable
              name={[
                'companies',
                record.companyName,
                'maintenancePrice',
                'price',
              ]}
              value={value || service?.rentPrice}
              onChange={(value) =>
                handleChange &&
                handleChange(value, record, 'servicePricePerMeter')
              }
            />
          ),
        },
        {
          title: 'Загальне',
          dataIndex: 'servicePriceSum',
          render: (__, record) => {
            const prioPrice = record.servicePricePerMeter || service?.rentPrice
            return (
              <FormAttribute
                form={form}
                name={[
                  'companies',
                  record.companyName,
                  'maintenancePrice',
                  'sum',
                ]}
                value={prioPrice * record.totalArea}
              />
            )
          },
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
              form={form}
              editable
              name={['companies', record.companyName, 'placingPrice', 'price']}
              value={value}
              onChange={(value) =>
                handleChange && handleChange(value, record, 'pricePerMeter')
              }
            />
          ),
        },
        {
          title: 'Загальне',
          dataIndex: 'priceSum',
          render: (__, record) => (
            <FormAttribute
              form={form}
              name={['companies', record.companyName, 'placingPrice', 'sum']}
              value={record.pricePerMeter * record.totalArea}
            />
          ),
        },
      ],
    },
    {
      title: service
        ? `Електрика: ${service.electricityPrice} грн/кВт`
        : 'Електрика',
      children: [
        {
          title: 'Стара',
          dataIndex: 'old_elec',
          render: (value, record) => (
            <FormAttribute
              form={form}
              editable
              name={[
                'companies',
                record.companyName,
                'electricityPrice',
                'lastAmount',
              ]}
              value={value}
              onChange={(value) =>
                handleChange && handleChange(value, record, 'old_elec')
              }
            />
          ),
        },
        {
          title: 'Нова',
          dataIndex: 'new_elec',
          render: (value, record) => (
            <FormAttribute
              form={form}
              editable
              name={[
                'companies',
                record.companyName,
                'electricityPrice',
                'amount',
              ]}
              value={value}
              onChange={(value) =>
                handleChange && handleChange(value, record, 'new_elec')
              }
            />
          ),
        },
        {
          title: 'Загальне',
          dataIndex: 'sum_elec',
          render: (__, record) => (
            <FormAttribute
              form={form}
              name={[
                'companies',
                record.companyName,
                'electricityPrice',
                'sum',
              ]}
              value={
                (record.new_elec - record.old_elec) * service?.electricityPrice
              }
            />
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
          render: (value, record) => (
            <FormAttribute
              form={form}
              editable
              name={[
                'companies',
                record.companyName,
                'waterPrice',
                'lastAmount',
              ]}
              value={value}
              onChange={(value) =>
                handleChange && handleChange(value, record, 'old_water')
              }
            />
          ),
        },
        {
          title: 'Нова',
          dataIndex: 'new_water',
          render: (value, record) => (
            <FormAttribute
              form={form}
              editable
              name={['companies', record.companyName, 'waterPrice', 'amount']}
              value={value}
              onChange={(value) =>
                handleChange && handleChange(value, record, 'new_water')
              }
            />
          ),
        },
        {
          title: 'Загальне',
          dataIndex: 'sum_water',
          render: (__, record) => (
            <FormAttribute
              form={form}
              name={['companies', record.companyName, 'waterPrice', 'sum']}
              value={
                (record.new_water - record.old_water) * service?.waterPrice
              }
            />
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
          title: 'Частка постачання',
          dataIndex: 'waterPart',
          render: (value, record) => (
            <FormAttribute
              form={form}
              editable
              name={['companies', record.companyName, 'waterPart', 'price']}
              value={value}
              onChange={(value) =>
                handleChange && handleChange(value, record, 'waterPart')
              }
            />
          ),
        },
        {
          title: 'Загальне',
          dataIndex: 'sum_waterPart',
          render: (__, record) => (
            <FormAttribute
              form={form}
              name={['companies', record.companyName, 'waterPart', 'sum']}
              value={record.waterPart * service?.waterPriceTotal}
            />
          ),
        },
      ],
    },
    {
      title: 'Індекс інфляції',
      dataIndex: 'inflicionPrice',
      render: (value, record) => (
        <FormAttribute
          form={form}
          editable
          name={['companies', record.companyName, 'inflicionPrice']}
          value={value}
        />
      ),
    },
    {
      title: 'ТПВ',
      dataIndex: 'garbageCollectoPrice',
      render: (value, record) => (
        <FormAttribute
          form={form}
          editable
          name={['companies', record.companyName, 'garbageCollector']}
          value={value}
        />
      ),
    },
    {
      title: 'Знижка',
      dataIndex: 'discount',
      render: (value, record) => (
        <FormAttribute
          form={form}
          editable
          name={['companies', record.companyName, 'discount']}
          value={value}
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
}
