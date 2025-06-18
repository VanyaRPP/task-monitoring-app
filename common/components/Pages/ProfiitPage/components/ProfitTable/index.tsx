'use client'

import { setTransactionTablePagination } from '@modules/store/profitPageSlice'
import { useGetByDomainQuery } from '@common/api/profitsApi/profits.api'
import { useAppDispatch, useAppSelector } from '@modules/store/hooks'
import { FC, useEffect, useMemo, useState, useCallback } from 'react'
import { Profit } from '@common/api/profitsApi/profits.type'
import { parentColumns, childColumns } from './tableConfig'
import { Table, Alert, Button, Space, Tooltip } from 'antd'

interface ProfitMonthSummary {
  key: string
  month: string
  debit: number
  credit: number
  profit: number
  count: number
  transactions: Profit[]
}

interface ProfitTableProps {
  domainId?: string
}

const ProfitTable: FC<ProfitTableProps> = ({ domainId }) => {
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

  const dataSource: ProfitMonthSummary[] = useMemo(() => {
    if (!profitsGrouped?.data) return []

    return Object.entries(profitsGrouped.data).map(([month, transactions]) => {
      const debit = transactions
        .filter((t) => t.type === 'debit')
        .reduce((acc, t) => acc + t.amount, 0)

      const credit = transactions
        .filter((t) => t.type === 'credit')
        .reduce((acc, t) => acc + t.amount, 0)

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
  }, [profitsGrouped])

  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([])

  useEffect(() => {
    if (dataSource.length > 0) {
      setExpandedRowKeys(dataSource.map((item) => item.key))
    } else {
      setExpandedRowKeys([])
    }
  }, [dataSource])

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
          pageSize: newPageSize,
        })
      )
      setExpandedRowKeys([])
    },
    [dispatch]
  )

  if (isError) return <Alert type="error" message="Не вдалося завантажити прибутки." />

  if (!profitsGrouped || Object.keys(profitsGrouped.data).length === 0)
    return <Alert type="info" message="Даних про прибутки не знайдено." />

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Tooltip
          title={isAllExpanded ? 'Згорнути всі рядки' : 'Розгорнути всі рядки'}
        >
          <Button
            onClick={isAllExpanded ? collapseAll : expandAll}
            disabled={isLoading || dataSource.length === 0}
            aria-pressed={isAllExpanded}
            aria-label={isAllExpanded ? 'Згорнути всі рядки' : 'Розгорнути всі рядки'}
          >
            {isAllExpanded ? 'Згорнути всі' : 'Розгорнути всі'}
          </Button>
        </Tooltip>
        <span>
          Розгорнуто: {expandedRowKeys.length} / {dataSource.length}
        </span>
      </Space>

      <Table
        loading={isLoading}
        columns={parentColumns}
        dataSource={dataSource}
        pagination={{
          position: ['bottomCenter'],
          showSizeChanger: true,
          pageSizeOptions: ['30', '50', '80', '100'],
          pageSize,
          current: currentPage,
          total: profitsGrouped.meta.total,
          onChange: handlePageChange,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} з ${total} записів`,
        }}
        expandable={{
          expandedRowRender: (record) => (
            <Table
              columns={childColumns}
              dataSource={record.transactions.map((t: Profit) => ({
                ...t,
                key: t._id,
              }))}
              pagination={false}
              rowKey={(record) => record._id}
            />
          ),
          rowExpandable: (record) => record.transactions.length > 0,
          expandedRowKeys,
          onExpandedRowsChange: (expandedKeys) =>
            setExpandedRowKeys([...expandedKeys] as string[]),
        }}
        rowKey={(record) => record.key}
        aria-label="Зведена таблиця прибутків"
      />
    </>
  )
}

export default ProfitTable
