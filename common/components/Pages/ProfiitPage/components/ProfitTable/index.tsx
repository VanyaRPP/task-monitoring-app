'use client'

import { setTransactionTablePagination } from '@modules/store/profitPageSlice'
import { useGetByDomainQuery } from '@common/api/profitsApi/profits.api'
import { useDeleteProfitMutation } from '@common/api/profitsApi/profits.api'
import { useAppDispatch, useAppSelector } from '@modules/store/hooks'
import { FC, useEffect, useMemo, useState, useCallback } from 'react'
import {
  getParentColumns,
  getChildColumns,
  MoneyCell,
  sumRowsByCurrency,
  type DrillTarget,
} from './tableConfig'
import {
  Profit,
  ProfitMonthRow,
  CurrencyTotals,
} from '@common/api/profitsApi/profits.type'
import AddCostModal from '@components/AddCostModal'
import ProfitDashboard from '../ProfitDashboard'
import {
  Table,
  Alert,
  Button,
  Space,
  Tooltip,
  message,
  Card,
  Empty,
  Typography,
  theme,
} from 'antd'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/router'
import { AppRoutes, Operations } from '@utils/constants'
import PaymentsDrilldown from '../PaymentsDrilldown'

interface ProfitTableProps {
  domainId?: string
}

const { Text } = Typography

const ProfitTable: FC<ProfitTableProps> = ({ domainId }) => {
  const router = useRouter()
  const isOnPage = router.pathname === AppRoutes.PROFIT
  const { token } = theme.useToken()
  const { t } = useTranslation()
  const [selectedProfit, setSelectedProfit] = useState<Profit | null>(null)
  const dispatch = useAppDispatch()
  const { currentPage, pageSize } = useAppSelector(
    (state) => state.profitPage.transactionTablePagination
  )

  const {
    data: profitsGrouped,
    isLoading,
    isError,
  } = useGetByDomainQuery(
    { domainId: domainId || '', page: currentPage, limit: pageSize },
    { skip: !domainId }
  )

  // The server already returns each month fully aggregated - expected income
  // from invoices, actual income from payments, expenses from manual records.
  const dataSource: ProfitMonthRow[] = useMemo(() => {
    if (!profitsGrouped?.data) return []
    return Object.values(profitsGrouped.data).map((row) => ({
      ...row,
      key: row.month,
    }))
  }, [profitsGrouped])

  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([])

  // Collapsed by default: the month row already carries all four figures, so
  // the overview is readable without expanding anything. Expanding every month
  // on load turned the page into one long flat list with month headers in it.
  useEffect(() => {
    setExpandedRowKeys([])
  }, [dataSource])

  // Every month expands, including ones with no expenses recorded yet - the
  // empty state inside says so. Hiding the toggle instead made it vanish from
  // most rows, which reads as a broken table rather than as "nothing here".
  const expandableKeys = useMemo(
    () => dataSource.map((r) => r.key),
    [dataSource]
  )

  const expandAll = useCallback(() => {
    setExpandedRowKeys(expandableKeys)
  }, [expandableKeys])

  const collapseAll = useCallback(() => {
    setExpandedRowKeys([])
  }, [])

  const isAllExpanded =
    expandableKeys.length > 0 &&
    expandedRowKeys.length === expandableKeys.length

  const handlePageChange = useCallback(
    (page: number, newPageSize?: number) => {
      dispatch(
        setTransactionTablePagination({
          currentPage: page,
          pageSize: newPageSize,
        })
      )
      setExpandedRowKeys([])
    },
    [dispatch]
  )
  const [isEditing, setIsEditing] = useState(false)

  // Which figure the user clicked through from; null keeps the modal closed.
  const [drilldown, setDrilldown] = useState<{
    month: string
    target: DrillTarget
    currency: string
  } | null>(null)

  const [deleteProfit, { isLoading: isDeleting }] = useDeleteProfitMutation()

  const handleDelete = async (id: string) => {
    try {
      await deleteProfit(id).unwrap()
      message.success(t('messages.deleted', { ns: 'profitPage' }))
    } catch (error) {
      message.error(t('messages.errorDelete', { ns: 'profitPage' }))
    }
  }

  if (isError)
    return <Alert type="error" message={t('profitPage:table.errorLoading')} />

  if (!profitsGrouped || Object.keys(profitsGrouped.data).length === 0)
    return <Alert type="info" message={t('profitPage:table.noData')} />

  return (
    <>
      <ProfitDashboard dataSource={dataSource} />

      <Card size="small" style={{ marginTop: 16 }}>
        <Space style={{ marginBottom: 16 }}>
          <Tooltip
            title={t(
              isAllExpanded
                ? 'profitPage:table.tooltipCollapse'
                : 'profitPage:table.tooltipExpand'
            )}
          >
            <Button
              onClick={isAllExpanded ? collapseAll : expandAll}
              disabled={isLoading || expandableKeys.length === 0}
              aria-pressed={isAllExpanded}
              aria-label={t(
                isAllExpanded
                  ? 'profitPage:table.tooltipCollapse'
                  : 'profitPage:table.tooltipExpand'
              )}
            >
              {t(
                isAllExpanded
                  ? 'profitPage:table.collapseAll'
                  : 'profitPage:table.expandAll'
              )}
            </Button>
          </Tooltip>
          <span>
            {t('profitPage:table.expanded', {
              current: expandedRowKeys.length,
              total: expandableKeys.length,
            })}
          </span>
        </Space>

        <Table
          bordered={true}
          loading={isLoading}
          columns={getParentColumns(token, (month, target, currency) =>
            setDrilldown({ month, target, currency })
          )}
          dataSource={dataSource}
          pagination={
            (router.pathname === AppRoutes.PROFIT ||
              router.pathname === AppRoutes.SEP_DOMAIN) && {
              position: ['bottomCenter'],
              hideOnSinglePage: false,
              showSizeChanger: true,
              // pages count MONTHS now, not individual records
              pageSizeOptions: ['6', '12', '24'],
              pageSize,
              current: currentPage,
              total: profitsGrouped.meta.total,
              onChange: handlePageChange,
              showTotal: (total, range) =>
                t('profitPage:table.paginationTotal', {
                  from: range[0],
                  to: range[1],
                  total,
                }),
            }
          }
          expandable={{
            expandedRowRender: (record) => (
              <Table
                // No border here: a bordered grid inside a bordered grid reads
                // as two stacked tables rather than one nested detail view.
                size="small"
                columns={getChildColumns(
                  (record) => {
                    setSelectedProfit(record)
                    setIsEditing(false)
                  },
                  (record) => {
                    setSelectedProfit(record)
                    setIsEditing(true)
                  },
                  handleDelete,
                  isDeleting
                )}
                dataSource={record.transactions.map((t: Profit) => ({
                  ...t,
                  key: t._id,
                }))}
                pagination={false}
                rowKey={(record) => record._id}
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={t('profitPage:table.child.noExpenses')}
                    />
                  ),
                }}
              />
            ),
            expandedRowKeys,
            onExpandedRowsChange: (expandedKeys) =>
              setExpandedRowKeys([...expandedKeys] as string[]),
          }}
          rowKey={(record) => record.key}
          aria-label={t('profitPage:table.tableAriaLabel')}
          summary={(rows: readonly ProfitMonthRow[]) => {
            const totals = sumRowsByCurrency(rows)
            return (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0}>
                    <Text strong>{t('profitPage:table.summary')}</Text>
                  </Table.Summary.Cell>
                  {(
                    [
                      (c) => c.expected,
                      (c) => c.actual,
                      (c) => c.outstanding,
                      (c) => c.expenses,
                    ] as ((c: CurrencyTotals) => number)[]
                  ).map((pick, i) => (
                    <Table.Summary.Cell key={i} index={i + 1} align="right">
                      <MoneyCell row={totals} pick={pick} />
                    </Table.Summary.Cell>
                  ))}
                  <Table.Summary.Cell index={5} align="right">
                    <MoneyCell
                      row={totals}
                      pick={(c) => c.net}
                      signed
                      token={token}
                    />
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )
          }}
        />
      </Card>

      {drilldown && (
        <PaymentsDrilldown
          domainId={domainId}
          month={drilldown.month}
          target={drilldown.target}
          currency={drilldown.currency}
          onClose={() => setDrilldown(null)}
        />
      )}

      {selectedProfit && (
        <AddCostModal
          currentProfit={selectedProfit}
          profitActions={{ preview: !isEditing, edit: isEditing }}
          closeModal={() => {
            setSelectedProfit(null)
            setIsEditing(false)
          }}
        />
      )}
    </>
  )
}

export default ProfitTable
