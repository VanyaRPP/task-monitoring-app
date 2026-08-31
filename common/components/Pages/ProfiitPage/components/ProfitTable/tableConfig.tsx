import {
  Profit,
  ProfitMonthRow,
  CurrencyTotals,
} from '@common/api/profitsApi/profits.type'
import { getCurrencySymbol } from '@utils/helpers'
import { ColumnsType } from 'antd/es/table'
import { t } from 'i18next'
import dayjs from 'dayjs'
import { Button, Popconfirm, Space, Tag, Tooltip, Typography } from 'antd'
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { GlobalToken } from 'antd'
import { Operations } from '@utils/constants'

const { Text } = Typography

/** Financial figures line up only when the glyphs are the same width. */
export const numericCell: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
}

export const money = (value: number) =>
  (value ?? 0).toLocaleString('uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

/**
 * A domain can invoice in several currencies at once, and those sums must
 * never be added together. So each cell lists one line per currency, symbol
 * first, busiest currency on top. Single-currency domains - the common case -
 * still see exactly one line.
 */
export const MoneyCell: React.FC<{
  row: Pick<ProfitMonthRow, 'currencies' | 'byCurrency'>
  pick: (t: CurrencyTotals) => number
  /** Colour by sign; only figures with a good/bad direction pass this. */
  signed?: boolean
  token?: GlobalToken
  onClick?: (currency: string) => void
}> = ({ row, pick, signed, token, onClick }) => {
  if (!row.currencies.length) {
    return <Text type="secondary">—</Text>
  }
  return (
    <Space direction="vertical" size={0} style={{ alignItems: 'flex-end' }}>
      {row.currencies.map((currency) => {
        const value = pick(row.byCurrency[currency])
        const label = `${getCurrencySymbol(currency)} ${money(value)}`
        const color =
          signed && token
            ? value >= 0
              ? token.colorSuccess
              : token.colorError
            : undefined

        if (onClick && value) {
          return (
            <Button
              key={currency}
              type="link"
              style={{ ...numericCell, padding: 0, height: 'auto', color }}
              onClick={() => onClick(currency)}
            >
              {label}
            </Button>
          )
        }
        return (
          <Text
            key={currency}
            strong={signed}
            style={{ ...numericCell, color }}
          >
            {label}
          </Text>
        )
      })}
    </Space>
  )
}

/**
 * `onDrill` opens the list of payments behind a figure. Only the two income
 * columns get it - expenses are already itemised in the expandable row.
 */
export type DrillTarget = Operations | 'outstanding'

/**
 * Roll several months up per currency. Used for the page summary row, where
 * folding currencies into one figure would be meaningless.
 */
export const sumRowsByCurrency = (rows: readonly ProfitMonthRow[]) => {
  const byCurrency: Record<string, CurrencyTotals> = {}
  const volume: Record<string, number> = {}

  for (const row of rows) {
    for (const currency of row.currencies) {
      const src = row.byCurrency[currency]
      const dst = (byCurrency[currency] ??= {
        expected: 0,
        actual: 0,
        expenses: 0,
        outstanding: 0,
        net: 0,
      })
      dst.expected += src.expected
      dst.actual += src.actual
      dst.expenses += src.expenses
      dst.outstanding += src.outstanding
      dst.net += src.net
      volume[currency] =
        (volume[currency] ?? 0) +
        Math.abs(src.expected) +
        Math.abs(src.actual) +
        Math.abs(src.expenses)
    }
  }

  return {
    byCurrency,
    currencies: Object.keys(byCurrency).sort((a, b) => volume[b] - volume[a]),
  }
}

export const getParentColumns = (
  token: GlobalToken,
  onDrill?: (month: string, target: DrillTarget, currency: string) => void
): ColumnsType<ProfitMonthRow> => [
  {
    title: t('table.parent.month', { ns: 'profitPage' }),
    dataIndex: 'month',
    key: 'month',
    width: 160,
    render: (month: string) => {
      const d = dayjs(month)
      if (!d.isValid()) return month
      const label = d.format('MMMM YYYY')
      return (
        <Text strong>{label.charAt(0).toUpperCase() + label.slice(1)}</Text>
      )
    },
  },
  {
    // Invoiced to clients. Not money in hand yet.
    title: t('table.parent.expected', { ns: 'profitPage' }),
    key: 'expected',
    width: 180,
    align: 'right',
    render: (_, record) => (
      <MoneyCell
        row={record}
        pick={(c) => c.expected}
        onClick={
          onDrill
            ? (currency) => onDrill(record.month, Operations.Debit, currency)
            : undefined
        }
      />
    ),
  },
  {
    // What actually arrived, with how much of the invoiced total that covers.
    title: t('table.parent.actual', { ns: 'profitPage' }),
    key: 'actual',
    width: 200,
    align: 'right',
    render: (_, record) => (
      <Space direction="vertical" size={0} style={{ alignItems: 'flex-end' }}>
        <MoneyCell
          row={record}
          pick={(c) => c.actual}
          onClick={
            onDrill
              ? (currency) => onDrill(record.month, Operations.Credit, currency)
              : undefined
          }
        />
        {record.currencies.length === 1 &&
          record.byCurrency[record.currencies[0]].expected > 0 && (
            <Tooltip
              title={t('table.parent.collectedHint', { ns: 'profitPage' })}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>
                {Math.round(
                  (record.byCurrency[record.currencies[0]].actual /
                    record.byCurrency[record.currencies[0]].expected) *
                    100
                )}
                %
              </Text>
            </Tooltip>
          )}
      </Space>
    ),
  },
  {
    // Invoiced but not collected. Clicking through answers "who owes", which
    // is the one figure on this page you can actually act on.
    title: t('table.parent.outstanding', { ns: 'profitPage' }),
    key: 'outstanding',
    width: 180,
    align: 'right',
    render: (_, record) => {
      // Rounding noise across many invoices leaves a few kopiykas either way;
      // below a unit there is nothing to chase.
      const owed = record.currencies.filter(
        (c) => Math.abs(record.byCurrency[c].outstanding) >= 1
      )
      if (!owed.length) return <Text type="secondary">—</Text>
      return (
        <MoneyCell
          row={{ ...record, currencies: owed }}
          pick={(c) => c.outstanding}
          onClick={
            onDrill
              ? (currency) => onDrill(record.month, 'outstanding', currency)
              : undefined
          }
        />
      )
    },
  },
  {
    // What the domain itself spent - never client-related.
    title: t('table.parent.expenses', { ns: 'profitPage' }),
    key: 'expenses',
    width: 170,
    align: 'right',
    render: (_, record) => <MoneyCell row={record} pick={(c) => c.expenses} />,
  },
  {
    // The only figure with a good/bad direction, so the only one we colour.
    title: t('table.parent.net', { ns: 'profitPage' }),
    key: 'net',
    width: 180,
    align: 'right',
    render: (_, record) => (
      <MoneyCell row={record} pick={(c) => c.net} signed token={token} />
    ),
  },
]

export const getChildColumns = (
  onPreview: (record: Profit) => void,
  onEdit: (record: Profit) => void,
  onDelete: (id: string) => void,
  isDeleting: boolean
): ColumnsType<Profit> => [
  {
    title: t('table.child.date', { ns: 'profitPage' }),
    dataIndex: 'date',
    key: 'date',
    width: 120,
    render: (date: string) => (
      <span style={numericCell}>{dayjs(date).format('DD.MM.YYYY')}</span>
    ),
  },
  {
    title: t('table.child.type', { ns: 'profitPage' }),
    dataIndex: 'type',
    key: 'type',
    width: 110,
    render: (type: string) =>
      type === 'debit' ? (
        <Tag>{t('table.child.debit', { ns: 'profitPage' })}</Tag>
      ) : (
        <Tag color="green">{t('table.child.credit', { ns: 'profitPage' })}</Tag>
      ),
  },
  {
    title: t('table.child.amount', { ns: 'profitPage' }),
    dataIndex: 'amount',
    key: 'amount',
    width: 130,
    align: 'right',
    render: (value: number, record) => (
      <span style={numericCell}>
        {getCurrencySymbol(record.currency)} {money(value)}
      </span>
    ),
  },
  {
    title: t('table.child.description', { ns: 'profitPage' }),
    dataIndex: 'description',
    key: 'description',
    ellipsis: true,
    render: (description: string) =>
      description || <Text type="secondary">—</Text>,
  },
  {
    title: t('table.child.categories', { ns: 'profitPage' }),
    dataIndex: 'categories',
    key: 'categories',
    width: 220,
    render: (cats: string[]) =>
      cats?.length ? (
        <Space size={[4, 4]} wrap>
          {cats.map((cat) => (
            <Tag key={cat} style={{ marginInlineEnd: 0 }}>
              {cat}
            </Tag>
          ))}
        </Space>
      ) : (
        <Text type="secondary">—</Text>
      ),
  },
  {
    title: t('table.child.author', { ns: 'profitPage' }),
    dataIndex: 'createdBy',
    key: 'createdBy',
    width: 160,
    render: (createdBy: Profit['createdBy']) =>
      createdBy?.name ? (
        <Tooltip title={createdBy.email}>
          <Text>{createdBy.name}</Text>
        </Tooltip>
      ) : (
        <Text type="secondary">
          {t('form.automatic', { ns: 'profitPage' })}
        </Text>
      ),
  },
  {
    title: '',
    key: 'action',
    align: 'right',
    width: 120,
    // Three actions do not need a dropdown - inline icons cost one click
    // instead of two and stay visible.
    render: (_, record) => (
      <Space size={0}>
        <Tooltip title={t('actions.preview', { ns: 'profitPage' })}>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => onPreview(record)}
            aria-label={t('actions.preview', { ns: 'profitPage' })}
          />
        </Tooltip>
        <Tooltip title={t('actions.edit', { ns: 'profitPage' })}>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
            aria-label={t('actions.edit', { ns: 'profitPage' })}
          />
        </Tooltip>
        <Popconfirm
          title={t('prompts.confirmDelete', { ns: 'profitPage' })}
          onConfirm={() => onDelete(record._id)}
          okText={t('actions.delete', { ns: 'profitPage' })}
          cancelText={t('actions.cancel', { ns: 'profitPage' })}
          okButtonProps={{ danger: true, loading: isDeleting }}
        >
          <Tooltip title={t('actions.delete', { ns: 'profitPage' })}>
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              aria-label={t('actions.delete', { ns: 'profitPage' })}
            />
          </Tooltip>
        </Popconfirm>
      </Space>
    ),
  },
]
