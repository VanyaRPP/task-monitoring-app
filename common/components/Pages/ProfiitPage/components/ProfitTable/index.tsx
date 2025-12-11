'use client'

import { setTransactionTablePagination } from '@modules/store/profitPageSlice'
import {
  useGetByDomainQuery,
  useDeleteProfitMutation,
} from '@common/api/profitsApi/profits.api'
import { useAppDispatch, useAppSelector } from '@modules/store/hooks'
import { FC, useEffect, useMemo, useState, useCallback } from 'react'
import { parentColumns, getChildColumns, ProfitMonthSummary, } from './tableConfig'
import { Profit } from '@common/api/profitsApi/profits.type'
import AddCostModal from '@components/AddCostModal'
import { Table, Alert, Button, Space, Tooltip, message } from 'antd'
import type { TablePaginationConfig } from 'antd/es/table'  
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/router'
import { AppRoutes } from '@utils/constants'

interface ProfitTableProps {
  domainId?: string
}

const ProfitTable: FC<ProfitTableProps> = ({ domainId }) => {
  const router = useRouter()
  const { t } = useTranslation()
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

  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([])
  const [selectedProfit, setSelectedProfit] = useState<Profit | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const [deleteProfit, { isLoading: isDeleting }] = useDeleteProfitMutation()

  const shouldPaginate =
    router.pathname === AppRoutes.PROFIT ||
    router.pathname === AppRoutes.SEP_DOMAIN

  const dataSource: ProfitMonthSummary[] = useMemo(() => {
    const grouped = profitsGrouped?.data
    if (!grouped) return []

    return Object.entries(grouped).map(([month, transactions]) => {
      const { debit, credit } = transactions.reduce(
        (acc, t) => {
          if (t.type === 'debit') acc.debit += t.amount
          else if (t.type === 'credit') acc.credit += t.amount
          return acc
        },
        { debit: 0, credit: 0 }
      )

      return {
        key: month,
        month,
        debit,
        credit,
        profit: credit - debit,
        count: transactions.length,
        transactions,
      }
    })
  }, [profitsGrouped?.data])

  useEffect(() => {
    if (!shouldPaginate) return

    setExpandedRowKeys(dataSource.length ? dataSource.map((i) => i.key) : [])
  }, [dataSource, shouldPaginate])

  const expandAll = useCallback(() => {
    setExpandedRowKeys(dataSource.map((item) => item.key))
  }, [dataSource])

  const collapseAll = useCallback(() => {
    setExpandedRowKeys([])
  }, [])

  const isAllExpanded =
    expandedRowKeys.length === dataSource.length && dataSource.length > 0

  const handlePageChange = useCallback(
    (page: number, newPageSize?: number) => {
      dispatch(
        setTransactionTablePagination({
          currentPage: page,
          pageSize: newPageSize ?? pageSize,
        })
      )
      setExpandedRowKeys([])
    },
    [dispatch, pageSize]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteProfit(id).unwrap()
        message.success(t('messages.deleted', { ns: 'profitPage' }))
      } catch {
        message.error(t('messages.errorDelete', { ns: 'profitPage' }))
      }
    },
    [deleteProfit, t]
  )

  const childColumns = useMemo(
    () =>
      getChildColumns(
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
      ),
    [handleDelete, isDeleting]
  )

  const expandedRowRender = useCallback(
    (record: ProfitMonthSummary) => (
      <Table
        bordered
        columns={childColumns}
        dataSource={record.transactions.map((t) => ({
          ...t,
          key: t._id,
        }))}
        pagination={false}
        rowKey="_id"
      />
    ),
    [childColumns]
  )

  // 👇 головне виправлення
  const paginationConfig = useMemo<TablePaginationConfig | false>(
    () =>
      shouldPaginate
        ? {
            position: ['bottomCenter'], // без `as const`
            hideOnSinglePage: false,
            showSizeChanger: true,
            pageSizeOptions: ['30', '50', '80', '100'],
            pageSize,
            current: currentPage,
            total: profitsGrouped?.meta.total,
            onChange: handlePageChange,
            showTotal: (total: number, range: [number, number]) =>
              t('profitPage:table.paginationTotal', {
                from: range[0],
                to: range[1],
                total,
              }),
          }
        : false,
    [shouldPaginate, pageSize, currentPage, profitsGrouped?.meta.total, t, handlePageChange]
  )

  if (isError)
    return <Alert type="error" message={t('profitPage:table.errorLoading')} />

  if (!profitsGrouped || Object.keys(profitsGrouped.data).length === 0)
    return <Alert type="info" message={t('profitPage:table.noData')} />

  return (
    <>
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
            disabled={isLoading || dataSource.length === 0}
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
            total: dataSource.length,
          })}
        </span>
      </Space>

      <Table
        bordered
        loading={isLoading}
        columns={parentColumns}
        dataSource={dataSource}
        pagination={paginationConfig}
        expandable={{
          expandedRowRender,
          rowExpandable: (record) => record.transactions.length > 0,
          expandedRowKeys,
          onExpandedRowsChange: (expandedKeys) =>
            setExpandedRowKeys(expandedKeys as string[]),
        }}
        rowKey={(record) => record.key}
        aria-label={t('profitPage:table.tableAriaLabel')}
      />

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
