'use client'

import { setTransactionTablePagination } from '@modules/store/profitPageSlice'
import { useGetByDomainQuery } from '@common/api/profitsApi/profits.api'
import { useAppDispatch, useAppSelector } from '@modules/store/hooks'
import { Profit } from '@common/api/profitsApi/profits.type'
import { parentColumns, childColumns } from './tableConfig'
import { Table, Alert } from 'antd'
import { FC, useMemo } from 'react'


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

  const dataSource = useMemo(() => {
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


  const handlePageChange = (page: number, newPageSize?: number) => {
    dispatch(
      setTransactionTablePagination({
        currentPage: page,
        pageSize: newPageSize,
      })
    )
  }

  if (isError) return <Alert type="error" message="Failed to load profits." />

  if (!profitsGrouped || Object.keys(profitsGrouped.data).length === 0)
    return <Alert type="info" message="No profit data available." />

  return (
    <Table
      loading={isLoading}
      columns={parentColumns}
      dataSource={dataSource}
      pagination={{
        showSizeChanger: true,
        pageSizeOptions: ['30', '50', '80', '100'],
        pageSize,
        current: currentPage,
        total: profitsGrouped.meta.total,
        onChange: handlePageChange,
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
          />
        ),
        rowExpandable: (record) => record.transactions.length > 0,
        defaultExpandedRowKeys: dataSource.map((item) => item.key),
      }}
    />
  )
}

export default ProfitTable
