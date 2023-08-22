import { CloseCircleOutlined } from '@ant-design/icons'
import { Popconfirm } from 'antd'

export const getPaymentsBulkDefaultColumns = (
  service?: any,
  handleDelete?: (row: any) => void
): any[] => [
  {
    fixed: 'left',
    title: 'Компанія',
    dataIndex: 'companyName',
    width: 200,
  },
  {
    title: 'Площа (м²)',
    dataIndex: 'totalArea',
  },
  {
    title: 'Утримання',
    children: [
      {
        title: 'За м²',
        dataIndex: 'servicePricePerMeter',
        render: (_, obj) => obj.servicePricePerMeter || service?.rentPrice,
        editable: true,
        type: 'number',
      },
      {
        title: 'Загальне',
        dataIndex: 'servicePrice',
        render: (_, obj) => {
          const prioPrice = obj.servicePricePerMeter || service?.rentPrice
          return prioPrice * obj.totalArea
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
        editable: true,
        type: 'number',
      },
      {
        title: 'Загальне',
        dataIndex: 'price',
        render: (_, obj) => obj.pricePerMeter * obj.totalArea,
      },
    ],
  },
  {
    title: 'Електрика',
    children: [
      {
        title: 'Стара',
        dataIndex: 'old_elec',
        editable: true,
        type: 'number',
      },
      {
        title: 'Нова',
        dataIndex: 'new_elec',
        editable: true,
        type: 'number',
      },
    ],
  },
  {
    title: 'Вода',
    children: [
      {
        title: 'Стара',
        dataIndex: 'old_water',
        editable: true,
        type: 'number',
      },
      {
        title: 'Нова',
        dataIndex: 'new_water',
        editable: true,
        type: 'number',
      },
    ],
  },
  {
    title: 'Індекс інфляції',
    dataIndex: 'tmp_1',
    editable: true,
    type: 'number',
  },
  {
    title: 'ТПВ',
    dataIndex: 'tmp_2',
    editable: true,
    type: 'number',
  },
  {
    title: 'Знижка',
    dataIndex: 'tmp_3',
    editable: true,
    type: 'number',
  },
  {
    fixed: 'right',
    align: 'center',
    title: '',
    dataIndex: '',
    width: 50,
    render: (_, record: { key: React.Key }) => (
      <Popconfirm
        title="Видалити запис?"
        onConfirm={() => handleDelete && handleDelete(record.key)}
      >
        <CloseCircleOutlined />
      </Popconfirm>
    ),
  },
]
