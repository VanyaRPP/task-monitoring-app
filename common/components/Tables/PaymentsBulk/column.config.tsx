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
              <Tooltip title="індивідуальне утримання, що передбачене договором">
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
      title: 'Електрика',
      children: [
        {
          title: 'Стара',
          dataIndex: 'old_elec',
          render: (value, record) => (
            <FormAttribute
              form={form}
              editable
              name={['companies', record.companyName, 'old_elec']}
              value={value}
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
              name={['companies', record.companyName, 'new_elec']}
              value={value}
            />
          ),
        },
      ],
    },
    {
      title: 'Вода',
      children: [
        {
          title: 'Стара',
          dataIndex: 'old_water',
          render: (value, record) => (
            <FormAttribute
              form={form}
              editable
              name={['companies', record.companyName, 'old_water']}
              value={value}
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
              name={['companies', record.companyName, 'new_water']}
              value={value}
            />
          ),
        },
      ],
    },
    {
      title: 'Індекс інфляції',
      dataIndex: 'tmp_1',
      render: (value, record) => (
        <FormAttribute
          form={form}
          editable
          name={['companies', record.companyName, 'tmp_1']}
          value={value}
        />
      ),
    },
    {
      title: 'ТПВ',
      dataIndex: 'tmp_2',
      render: (value, record) => (
        <FormAttribute
          form={form}
          editable
          name={['companies', record.companyName, 'tmp_2']}
          value={value}
        />
      ),
    },
    {
      title: 'Знижка',
      dataIndex: 'tmp_3',
      render: (value, record) => (
        <FormAttribute
          form={form}
          editable
          name={['companies', record.companyName, 'tmp_3']}
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
