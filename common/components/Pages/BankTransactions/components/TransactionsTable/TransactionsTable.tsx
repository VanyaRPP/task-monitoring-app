import React from 'react'
import { Table, Checkbox, MenuProps, Space } from 'antd'
import { useColumnVisibility } from './components/useColumnVisibility'
import { ITransaction } from './components/transactionTypes'
import { defaultVisibleColumns, generateColumns } from './components/column'
import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'

interface Props {
  transactions: ITransaction[]
  pagination?: React.ReactNode
  domain: IExtendedDomain
  loading?: boolean
  companies: IRealestate[]
  refetchTransactions?: () => void
}

const TransactionsTable: React.FC<Props> = ({
  transactions,
  pagination,
  domain,
  loading,
  companies,
  refetchTransactions,
}) => {
  const { visibleColumns, toggleColumnVisibility } = useColumnVisibility(
    defaultVisibleColumns
  )

  // const items: MenuProps['items'] = columnNames.map((col) => ({
  //   key: col,
  //   label: (
  //     <Checkbox
  //       value={col}
  //       checked={visibleColumns.includes(col)}
  //       onChange={(e) => toggleColumnVisibility(e.target.value)}
  //     >
  //       {col}
  //     </Checkbox>
  //   ),
  // }))

  // const [tableSettingDropdovnVisible, setTableSettingDropdovnVisible] =
  //   useState<boolean>(false)

  const columns = generateColumns(
    visibleColumns,
    domain,
    toggleColumnVisibility,
    companies,
    refetchTransactions
  )

  return (
    <>
      <Table<ITransaction>
        key={transactions?.length}
        scroll={{ x: true }}
        dataSource={transactions}
        columns={columns}
        pagination={false}
        rowKey="ID"
        loading={loading}
        sticky={{ offsetHeader: 64 }}
      />
      <Space
        direction="vertical"
        align="center"
        style={{ width: '100%', marginTop: '0.5rem' }}
      >
        {pagination}
      </Space>
    </>
  )
}

export default TransactionsTable
