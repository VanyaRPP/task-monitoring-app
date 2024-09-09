import React, { useState } from 'react'
import { Table, Dropdown, Checkbox, MenuProps, Space } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import { useColumnVisibility } from './components/useColumnVisibility'
import { ITransaction } from './components/transactionTypes'
import {
  columnNames,
  defaultVisibleColumns,
  generateColumns,
} from './components/column'

interface Props {
  transactions: ITransaction[]
  pagination?: React.ReactNode
}

const TransactionsTable: React.FC<Props> = ({ transactions, pagination }) => {
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

  return (
    <Space direction="vertical" align="end">
      <Dropdown
        overlayStyle={{ overflow: 'scroll', maxHeight: '300px' }}
        open={tableSettingDropdovnVisible}
        onOpenChange={() =>
          setTableSettingDropdovnVisible(!tableSettingDropdovnVisible)
        }
        menu={{ items }}
        trigger={['click']}
      >
        <SettingOutlined />
      </Dropdown>
      <Space direction="vertical" align="center">
        <Table<ITransaction>
          scroll={{ x: true }}
          dataSource={transactions}
          columns={generateColumns(visibleColumns)}
          pagination={false}
          rowKey="ID"
        />
        {pagination}
      </Space>
    </Space>
  )
}

export default TransactionsTable
