import { Profit } from '@common/api/profitsApi/profits.type'
import { ColumnsType } from 'antd/es/table'
import { t } from 'i18next'
import dayjs from '@utils/dayjs'
import { Button, Dropdown,Popconfirm } from 'antd'
import { EyeOutlined, EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'

interface ProfitMonthSummary {
  key: string
  month: string
  debit: number
  credit: number
  profit: number
  count: number
  transactions: Profit[]
}

export const parentColumns: ColumnsType<ProfitMonthSummary> = [
  {
    title: t('table.parent.month', { ns: 'profitPage' }),
    dataIndex: 'month',
    key: 'month',
    width: 150,
    render: (month: string) =>
      dayjs(month).isValid() ? dayjs(month).format('MMMM YYYY') : month,
  },
  {
    title: t('table.parent.debit', { ns: 'profitPage' }),
    dataIndex: 'debit',
    key: 'debit',
    width: 100,
    render: (value: number) => value.toFixed(2),
  },
  {
    title: t('table.parent.credit', { ns: 'profitPage' }),
    dataIndex: 'credit',
    key: 'credit',
    width: 100,
    render: (value: number) => value.toFixed(2),
  },
  {
    title: t('table.parent.profit', { ns: 'profitPage' }),
    dataIndex: 'profit',
    key: 'profit',
    width: 140,
    render: (value: number) => (
      <span style={{ color: value >= 0 ? 'green' : 'red' }}>
        {value.toFixed(2)}
      </span>
    ),
  },
  {
    title: t('table.parent.totalRecords', { ns: 'profitPage' }),
    dataIndex: 'count',
    key: 'count',
    width: 160,
  },
]

export const getChildColumns= (
    onPreview: (record: Profit) => void, 
    onEdit: (record: Profit) => void, 
    onDelete: (id: string) => void,
    isDeleting: boolean): ColumnsType<Profit> => [
  {
    title: t('table.child.date', { ns: 'profitPage' }),
    dataIndex: 'date',
    key: 'date',
    width: 185,
    render: (date: string) => new Date(date).toLocaleDateString(),
  },
  {
    title: t('table.child.type', { ns: 'profitPage' }),
    dataIndex: 'type',
    key: 'type',
    width: 100,
    render: (type: string) => {
      if (type === 'debit') return t('table.child.debit', { ns: 'profitPage' })
      if (type === 'credit')
        return t('table.child.credit', { ns: 'profitPage' })
      return type
    },
  },
  {
    title: t('table.child.amount', { ns: 'profitPage' }),
    dataIndex: 'amount',
    key: 'amount',
    width: 100,
  },
  {
    title: t('table.child.description', { ns: 'profitPage' }),
    dataIndex: 'description',
    key: 'description',
    width: 140,
  },
  {
    title: t('table.child.categories', { ns: 'profitPage' }),
    dataIndex: 'categories',
    key: 'categories',
    width: 90,
    render: (cats: string[]) => cats?.join(', ') || '-',
  },
  {
    title: '',
    key: 'action',
    align: 'center',
    width: 40,
    fixed: 'right',
    render: (_, record) => {
  const menuItems: MenuProps['items'] = [
    {
      key: 'view',
      label: (
        <Button
          icon={<EyeOutlined />}
          type="link"
          style={{ color: '#722ed1', padding: '0 10px' }}
          onClick={() => onPreview(record)}
        >
          {t('actions.preview', { ns: 'profitPage' })}
        </Button>
      ),
    },
    {
      key: 'edit',
      label: (
        <Button
          icon={<EditOutlined />}
          type="link"
          style={{ color: '#722ed1', padding: '0 10px' }}
          onClick={() => onEdit(record)}
        >
          {t('actions.edit', { ns: 'profitPage' })}
        </Button>
      ),
    },
    {
      key: 'delete',
      label: (
        <Popconfirm
          title={t('prompts.confirmDelete', { ns: 'profitPage' })}
          onConfirm={() => onDelete(record._id)}
          okText={t('actions.delete', { ns: 'profitPage' })}
          cancelText={t('actions.cancel', { ns: 'profitPage' })}
        >
          <Button
            icon={<DeleteOutlined />}
            type="link"
            style={{ color: '#ff4d4f', padding: '0 10px' }}
          >
            {t('actions.delete', { ns: 'profitPage' })}
          </Button>
        </Popconfirm>
      ),
    }
  ]

  return (
    <Dropdown menu={{ items: menuItems }} placement="bottomRight">
      <Button icon={<MoreOutlined />} />
    </Dropdown>
  )
}
  }
]
