import { useMemo } from 'react'
import {
  Button,
  DatePicker,
  Input,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { FilterDropdownProps, FilterValue } from 'antd/es/table/interface'
import { SearchOutlined, EyeOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import {
  IPaymentChangeLog,
  PaymentActionType,
} from '@common/api/paymentApi/payment.api.types'
import { renderCurrency, getCurrencySymbol } from '@utils/helpers'

const { Text } = Typography
const { RangePicker } = DatePicker

export const ACTION_COLORS: Record<PaymentActionType, string> = {
  CREATE: 'green',
  BULK_CREATE: 'lime',
  UPDATE: 'blue',
  DELETE: 'red',
  BULK_DELETE: 'volcano',
  MARK_PAID: 'cyan',
  RESTORE: 'purple',
}

const ACTION_OPTIONS = (Object.keys(ACTION_COLORS) as PaymentActionType[]).map(
  (value) => ({ text: value, value })
)

const SOURCE_OPTIONS = [
  { text: 'single', value: 'single' },
  { text: 'bulk', value: 'bulk' },
  { text: 'quick-pay', value: 'quick-pay' },
  { text: 'admin-restore', value: 'admin-restore' },
]

const dateRangeDropdown = ({
  selectedKeys,
  setSelectedKeys,
  confirm,
  clearFilters,
}: FilterDropdownProps) => {
  const value: [Dayjs, Dayjs] | null =
    selectedKeys.length === 2
      ? [dayjs(selectedKeys[0] as string), dayjs(selectedKeys[1] as string)]
      : null

  return (
    <div style={{ padding: 8 }}>
      <RangePicker
        value={value as any}
        format="DD.MM.YYYY"
        style={{ marginBottom: 8 }}
        onChange={(dates) => {
          if (dates && dates[0] && dates[1]) {
            setSelectedKeys([
              dates[0].startOf('day').toISOString(),
              dates[1].endOf('day').toISOString(),
            ])
          } else {
            setSelectedKeys([])
          }
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <Button
          size="small"
          onClick={() => {
            clearFilters?.()
            confirm()
          }}
        >
          Скинути
        </Button>
        <Button type="primary" size="small" onClick={() => confirm()}>
          OK
        </Button>
      </div>
    </div>
  )
}

const actorSearchDropdown = ({
  selectedKeys,
  setSelectedKeys,
  confirm,
  clearFilters,
}: FilterDropdownProps) => (
  <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
    <Input
      autoFocus
      placeholder="Email користувача"
      value={selectedKeys[0] as string}
      onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
      onPressEnter={() => confirm()}
      style={{ marginBottom: 8, display: 'block', width: 220 }}
    />
    <Space>
      <Button
        type="primary"
        size="small"
        icon={<SearchOutlined />}
        onClick={() => confirm()}
      >
        Пошук
      </Button>
      <Button
        size="small"
        onClick={() => {
          clearFilters?.()
          confirm()
        }}
      >
        Скинути
      </Button>
    </Space>
  </div>
)

interface FacetOption {
  text: string
  value: string
}

interface Params {
  filters: Record<string, FilterValue | null>
  onOpenDetails: (record: IPaymentChangeLog) => void
  domainOptions: FacetOption[]
  companyOptions: FacetOption[]
}

const TYPE_OPTIONS = [
  { text: 'Дебет', value: 'debit' },
  { text: 'Кредит', value: 'credit' },
]

export const usePaymentAuditColumns = ({
  filters,
  onOpenDetails,
  domainOptions,
  companyOptions,
}: Params): ColumnsType<IPaymentChangeLog> => {
  return useMemo<ColumnsType<IPaymentChangeLog>>(
    () => [
      {
        title: 'Дата',
        dataIndex: 'date',
        key: 'date',
        width: 160,
        filteredValue: filters.date ?? null,
        filterDropdown: dateRangeDropdown,
        render: (date: string) =>
          date ? dayjs(date).format('DD.MM.YYYY HH:mm') : '—',
      },
      {
        title: 'Користувач',
        dataIndex: 'actorEmail',
        key: 'actorEmail',
        width: 200,
        filteredValue: filters.actorEmail ?? null,
        filterIcon: (filtered) => (
          <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />
        ),
        filterDropdown: actorSearchDropdown,
        render: (email?: string) => email || 'system',
      },
      {
        title: 'Дія',
        dataIndex: 'actionType',
        key: 'actionType',
        width: 130,
        filteredValue: filters.actionType ?? null,
        filters: ACTION_OPTIONS,
        render: (action?: PaymentActionType) =>
          action ? (
            <Tag color={ACTION_COLORS[action]}>{action}</Tag>
          ) : (
            <Tag>—</Tag>
          ),
      },
      {
        title: 'Джерело',
        dataIndex: 'source',
        key: 'source',
        width: 120,
        filteredValue: filters.source ?? null,
        filters: SOURCE_OPTIONS,
        render: (source?: string) => source || '—',
      },
      {
        title: 'Тип',
        key: 'type',
        width: 100,
        align: 'center',
        filteredValue: filters.type ?? null,
        filters: TYPE_OPTIONS,
        render: (_, record) => {
          const type =
            record.invoiceData?.type ??
            (record.before as any)?.type ??
            (record.after as any)?.type
          if (!type) return '—'
          return type === 'credit' ? (
            <Tag color="green">Кредит</Tag>
          ) : (
            <Tag color="geekblue">Дебет</Tag>
          )
        },
      },
      {
        title: 'Інвойс №',
        key: 'invoiceNumber',
        width: 100,
        render: (_, record) => record.invoiceData?.invoiceNumber ?? '—',
      },
      {
        title: 'Сума',
        key: 'generalSum',
        width: 120,
        align: 'center',
        render: (_, record) => {
          const sum = record.invoiceData?.generalSum
          if (sum == null) return '—'
          const currency =
            record.invoiceData?.currency ||
            (record.before as any)?.currency ||
            (record.after as any)?.currency
          return `${renderCurrency(sum)} ${getCurrencySymbol(currency)}`.trim()
        },
      },
      {
        title: 'Домен',
        key: 'domainId',
        width: 150,
        align: 'center',
        ellipsis: true,
        filteredValue: filters.domainId ?? null,
        filters: domainOptions,
        filterMultiple: false,
        filterSearch: true,
        render: (_, record) => {
          const rawDomain =
            record.domainId ??
            (record.before as any)?.domain ??
            (record.after as any)?.domain
          const snapshotName =
            typeof rawDomain === 'object' ? rawDomain.name : undefined
          const name = record.domainName ?? snapshotName
          return name ? (
            <Tooltip title={String(name)}>
              <Text style={{ maxWidth: 140 }} ellipsis>
                {String(name)}
              </Text>
            </Tooltip>
          ) : (
            <Text type="secondary">Не знайдено</Text>
          )
        },
      },
      {
        title: 'Компанія',
        key: 'company',
        width: 160,
        align: 'center',
        ellipsis: true,
        filteredValue: filters.company ?? null,
        filters: companyOptions,
        filterMultiple: false,
        filterSearch: true,
        render: (_, record) => {
          const rawCompany =
            record.companyId ??
            (record.before as any)?.company ??
            (record.after as any)?.company
          const snapshotName =
            typeof rawCompany === 'object' ? rawCompany.companyName : undefined
          const name = record.companyName ?? snapshotName
          return name ? (
            <Tooltip title={String(name)}>
              <Text style={{ maxWidth: 150 }} ellipsis>
                {String(name)}
              </Text>
            </Tooltip>
          ) : (
            <Text type="secondary">Не знайдено</Text>
          )
        },
      },
      {
        title: 'Деталі',
        key: 'details',
        width: 90,
        align: 'center',
        fixed: 'right',
        render: (_, record) => (
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => onOpenDetails(record)}
          />
        ),
      },
    ],
    [filters, onOpenDetails, domainOptions, companyOptions]
  )
}

export default usePaymentAuditColumns
