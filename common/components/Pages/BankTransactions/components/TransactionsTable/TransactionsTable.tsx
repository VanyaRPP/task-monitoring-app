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

  const columns = generateColumns(visibleColumns)

  return (
    <div>
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

      <div>
        <Table<ITransaction>
          scroll={{ x: true }}
          dataSource={transactions}
          columns={columns}
          pagination={false}
          rowKey="ID"
          sticky={{ offsetHeader: 64 }}
        />
        <Space
          direction="vertical"
          align="center"
          style={{ width: '100%', marginTop: '0.5rem' }}
        >
          {pagination}
        </Space>
      </div>
    </div>
  )
}

export default TransactionsTable
