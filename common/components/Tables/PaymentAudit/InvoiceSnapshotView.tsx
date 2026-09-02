import { Descriptions, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import {
  renderCurrency,
  getCurrencySymbol,
  getCurrencyShortLabel,
} from '@utils/helpers'
import type { IPaymentField } from '@common/api/paymentApi/payment.api.types'

const { Text } = Typography

type Snapshot = Record<string, any>

const lineName = (row: IPaymentField) =>
  row.name || row.customName || row.fieldName || row.type || '—'

const InvoiceSnapshotView: React.FC<{ snapshot?: Snapshot | null }> = ({
  snapshot,
}) => {
  if (!snapshot) return <Text type="secondary">Немає даних</Text>

  const currency = snapshot.currency
  const symbol = getCurrencySymbol(currency)
  const lines: IPaymentField[] = Array.isArray(snapshot.invoice)
    ? snapshot.invoice
    : []

  const columns: ColumnsType<IPaymentField> = [
    { title: 'Послуга', key: 'name', render: (_, r) => lineName(r) },
    {
      title: 'К-сть',
      dataIndex: 'amount',
      width: 80,
      align: 'center',
      render: (v) => v ?? '—',
    },
    {
      title: 'Ціна',
      dataIndex: 'price',
      width: 100,
      align: 'right',
      render: (v) => (v != null ? renderCurrency(v) : '—'),
    },
    {
      title: 'Сума',
      dataIndex: 'sum',
      width: 110,
      align: 'right',
      render: (v) => (v != null ? renderCurrency(v) : '—'),
    },
  ]

  return (
    <div>
      <Descriptions size="small" column={2} style={{ marginBottom: 12 }}>
        <Descriptions.Item label="Інвойс №">
          {snapshot.invoiceNumber ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Дата">
          {snapshot.invoiceCreationDate
            ? dayjs(snapshot.invoiceCreationDate).format('DD.MM.YYYY')
            : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Тип">
          {snapshot.type === 'credit' ? (
            <Tag color="green">Кредит</Tag>
          ) : (
            <Tag color="geekblue">Дебет</Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Валюта">
          {getCurrencyShortLabel(currency)} {symbol}
        </Descriptions.Item>
        {snapshot.provider?.description && (
          <Descriptions.Item label="Постачальник" span={2}>
            <span style={{ whiteSpace: 'pre-line' }}>
              {snapshot.provider.description}
            </span>
          </Descriptions.Item>
        )}
        {snapshot.reciever?.companyName && (
          <Descriptions.Item label="Отримувач" span={2}>
            <span style={{ whiteSpace: 'pre-line' }}>
              {snapshot.reciever.companyName}
              {snapshot.reciever.description
                ? `\n${snapshot.reciever.description}`
                : ''}
            </span>
          </Descriptions.Item>
        )}
        {snapshot.description && (
          <Descriptions.Item label="Опис" span={2}>
            <span style={{ whiteSpace: 'pre-line' }}>
              {snapshot.description}
            </span>
          </Descriptions.Item>
        )}
      </Descriptions>

      <Table<IPaymentField>
        size="small"
        rowKey={(_r, index) => String(index)}
        columns={columns}
        dataSource={lines}
        pagination={false}
        locale={{ emptyText: 'Немає позицій' }}
      />

      <div style={{ textAlign: 'right', marginTop: 12, fontWeight: 600 }}>
        Загалом:{' '}
        {snapshot.generalSum != null
          ? renderCurrency(snapshot.generalSum)
          : '—'}{' '}
        {symbol}
      </div>
    </div>
  )
}

export default InvoiceSnapshotView
