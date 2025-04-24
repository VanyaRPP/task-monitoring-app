import React, { useState } from 'react'
import { Table, Dropdown, Checkbox, MenuProps, Space, Spin  } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import { useColumnVisibility } from './components/useColumnVisibility'
// import { ITransaction } from '@common/api/bankApi/mockBank.api'
import { ITransaction } from './components/transactionTypes'
import {
  columnNames,
  defaultVisibleColumns,
  generateColumns,
} from './components/column'
import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'

interface Props {
  transactions: ITransaction[]
  pagination?: React.ReactNode
  domain: IExtendedDomain
  loading?: boolean
}

const TransactionsTable: React.FC<Props> = ({
  transactions,
  pagination,
  domain,
  loading,
}) => {
  const { visibleColumns, toggleColumnVisibility } = useColumnVisibility(
    defaultVisibleColumns
  )

  const items: MenuProps['items'] = columnNames.map((col) => ({
    key: col,
    label: (
      <Checkbox
        value={col}
        checked={visibleColumns.includes(col)}
        onChange={(e) => toggleColumnVisibility(e.target.value)}
      >
        {col}
      </Checkbox>
    ),
  }))

  const [tableSettingDropdovnVisible, setTableSettingDropdovnVisible] =
    useState<boolean>(false)

  const columns = generateColumns(
    visibleColumns,
    domain,
    toggleColumnVisibility
  )
// const staticColumns = [
//   { title: 'My Name', dataIndex: 'AUT_MY_NAM', key: 'AUT_MY_NAM' },
//   { title: 'My Account', dataIndex: 'AUT_MY_ACC', key: 'AUT_MY_ACC' },
//   { title: 'MFO', dataIndex: 'AUT_MY_MFO', key: 'AUT_MY_MFO' },
//   { title: 'Transaction Type', dataIndex: 'TRANTYPE', key: 'TRANTYPE' },
// ]
//    const columns = staticColumns

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
