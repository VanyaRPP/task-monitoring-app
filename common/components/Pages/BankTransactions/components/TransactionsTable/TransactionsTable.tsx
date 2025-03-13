import React, { useState } from 'react'
import { Table, Dropdown, Checkbox, MenuProps, Space } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import { useColumnVisibility } from './components/useColumnVisibility'
import { ITransaction } from '@common/api/bankApi/mockBank.api'
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
}

const TransactionsTable: React.FC<Props> = ({
  transactions,
  pagination,
  domain,
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

//   const staticColumns = [
//     { title: 'Counterparty Name', dataIndex: 'AUT_CNTR_NAM', key: 'AUT_CNTR_NAM' },
//     { title: 'Description', dataIndex: 'OSND', key: 'OSND' },
//     { title: 'Amount', dataIndex: 'SUM', key: 'SUM' },
//     { title: 'Transaction Time', dataIndex: 'DATE_TIME_DAT_OD_TIM_P', key: 'DATE_TIME_DAT_OD_TIM_P' },
//     { title: 'Type', dataIndex: 'TRANTYPE', key: 'TRANTYPE' },
//   ]

//  const columns = staticColumns

  return (
    <>
      <Table<ITransaction>
        scroll={{ x: true }}
        dataSource={transactions}
        columns={columns}
        pagination={false}
        rowKey={(record) => record.ID || record.AUT_MY_ACC}
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
