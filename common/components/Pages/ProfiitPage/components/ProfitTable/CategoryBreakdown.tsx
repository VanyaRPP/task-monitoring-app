import { FC, useMemo } from 'react'
import {
  Collapse,
  Empty,
  Progress,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import type { Profit } from '@common/api/profitsApi/profits.type'
import { getCurrencySymbol } from '@utils/helpers'
import {
  groupProfitByCategory,
  type CategoryGroup,
  type CategoryLine,
} from '@utils/profit-categories'
import {
  RecordActions,
  getChildColumns,
  money,
  numericCell,
} from './tableConfig'
import s from './style.module.scss'

const { Text } = Typography

interface CategoryBreakdownProps {
  transactions: Profit[]
  onPreview: (record: Profit, itemIndex?: number) => void
  onEdit: (record: Profit, itemIndex?: number) => void
  onDelete: (id: string) => void
  isDeleting: boolean
}

/**
 * Expanded month: expenses rolled up by category (sum, share), each opening
 * into its individual lines. Income records are not expenses, so they sit
 * apart in their own table instead of skewing the shares.
 */
const CategoryBreakdown: FC<CategoryBreakdownProps> = ({
  transactions,
  onPreview,
  onEdit,
  onDelete,
  isDeleting,
}) => {
  const { t } = useTranslation()

  // Category rows are expenses only; income has no categories to split by and
  // would skew the shares, so it shows up in the records table alone.
  const groups = useMemo(
    () =>
      groupProfitByCategory(
        transactions.filter((tr) => tr.type === 'debit'),
        t('profitPage:dashboard.uncategorized')
      ),
    [transactions, t]
  )

  // The categories column is what the breakdown below replaces.
  const recordColumns = useMemo(
    () =>
      getChildColumns(onPreview, onEdit, onDelete, isDeleting).filter(
        (column) => column.key !== 'categories'
      ),
    [onPreview, onEdit, onDelete, isDeleting]
  )

  const groupColumns: ColumnsType<CategoryGroup<Profit>> = [
    {
      title: t('profitPage:table.child.category'),
      dataIndex: 'category',
      key: 'category',
      ellipsis: true,
      render: (category: string) => <Text strong>{category}</Text>,
      sorter: (a, b) => a.category.localeCompare(b.category, 'uk'),
    },
    {
      title: t('profitPage:table.child.lines'),
      key: 'lines',
      width: 100,
      align: 'right',
      render: (_, group) => group.lines.length,
      sorter: (a, b) => a.lines.length - b.lines.length,
    },
    {
      title: t('profitPage:table.child.amount'),
      key: 'total',
      width: 160,
      align: 'right',
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.total - b.total,
      render: (_, group) => (
        <Text strong style={numericCell}>
          {getCurrencySymbol(group.currency)} {money(group.total)}
        </Text>
      ),
    },
    {
      title: t('profitPage:table.child.share'),
      key: 'share',
      width: 180,
      sorter: (a, b) => a.share - b.share,
      render: (_, group) => (
        <Progress
          percent={Math.round(group.share * 100)}
          size="small"
          strokeColor="#1677ff"
        />
      ),
    },
  ]

  const lineColumns: ColumnsType<CategoryLine<Profit>> = [
    {
      title: t('profitPage:table.child.date'),
      key: 'date',
      width: 120,
      sorter: (a, b) =>
        dayjs(a.record.date).valueOf() - dayjs(b.record.date).valueOf(),
      render: (_, line) => (
        <span style={numericCell}>
          {dayjs(line.record.date).format('DD.MM.YYYY')}
        </span>
      ),
    },
    {
      title: t('profitPage:table.child.description'),
      key: 'description',
      ellipsis: true,
      render: (_, line) => {
        const text = line.description || line.record.description
        return (
          <Space size={4}>
            {text ? (
              <Tooltip title={text} placement="topLeft">
                <span>{text}</span>
              </Tooltip>
            ) : (
              <Text type="secondary">—</Text>
            )}
            {line.approximate && (
              <Tooltip title={t('profitPage:table.child.approximateHint')}>
                <Tag style={{ marginInlineEnd: 0 }}>~</Tag>
              </Tooltip>
            )}
          </Space>
        )
      },
    },
    {
      title: t('profitPage:table.child.amount'),
      key: 'amount',
      width: 140,
      align: 'right',
      sorter: (a, b) => a.amount - b.amount,
      render: (_, line) => (
        <span style={numericCell}>
          {getCurrencySymbol(line.record.currency)} {money(line.amount)}
        </span>
      ),
    },
    {
      title: t('profitPage:table.child.author'),
      key: 'author',
      width: 160,
      render: (_, line) =>
        line.record.createdBy?.name ? (
          <Tooltip title={line.record.createdBy.email}>
            <Text>{line.record.createdBy.name}</Text>
          </Tooltip>
        ) : (
          <Text type="secondary">{t('profitPage:form.automatic')}</Text>
        ),
    },
    {
      title: '',
      key: 'action',
      align: 'right',
      width: 120,
      render: (_, line) => (
        <RecordActions
          record={line.record}
          onPreview={(record) => onPreview(record, line.itemIndex)}
          onEdit={(record) => onEdit(record, line.itemIndex)}
          onDelete={onDelete}
          isDeleting={isDeleting}
          canDelete={(line.record.items?.length ?? 0) < 2}
        />
      ),
    },
  ]

  if (!transactions.length) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={t('profitPage:table.child.noExpenses')}
      />
    )
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {/* A bare row, not a boxed panel: it is a way in to edit/delete, and
          the category breakdown below is what this month is read for. */}
      <Collapse
        ghost
        size="small"
        items={[
          {
            key: 'records',
            label: (
              <Text strong>
                {t('profitPage:table.child.recordsTitle', {
                  count: transactions.length,
                })}
              </Text>
            ),
            children: (
              <Table
                size="small"
                className={s.childTable}
                columns={recordColumns}
                dataSource={transactions}
                rowKey={(record) => record._id}
                pagination={false}
              />
            ),
          },
        ]}
      />

      {groups.length > 0 && (
        <Table<CategoryGroup<Profit>>
          size="small"
          className={s.childTable}
          columns={groupColumns}
          dataSource={groups}
          rowKey="key"
          pagination={false}
          title={() => (
            <Text strong>{t('profitPage:table.child.expensesTitle')}</Text>
          )}
          expandable={{
            expandRowByClick: true,
            expandedRowRender: (group) => (
              <Table<CategoryLine<Profit>>
                size="small"
                className={s.childTable}
                columns={lineColumns}
                dataSource={group.lines}
                rowKey={(line, index) => `${line.record._id}|${index}`}
                pagination={false}
              />
            ),
          }}
        />
      )}
    </Space>
  )
}

export default CategoryBreakdown
