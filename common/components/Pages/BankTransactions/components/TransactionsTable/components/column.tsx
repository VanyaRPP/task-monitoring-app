import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  SearchOutlined,
  SettingOutlined,
  StopOutlined,
} from '@ant-design/icons'
import {
  Popover,
  Input,
  Button,
  DatePicker,
  Dropdown,
  MenuProps,
  Checkbox,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
// import { ITransaction } from '@common/api/bankApi/mockBank.api'
import { ITransaction } from './transactionTypes'
import { useState } from 'react'
import { IExtendedDomain } from '@common/api/domainApi/domain.api.types'
import TransactionDrawer from './TransactionsDrawer'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { getResolvedDescription } from './bankHelper'



const { RangePicker } = DatePicker

// Utility function to return column search props

const getColumnSearchProps = (dataIndex: keyof ITransaction) => ({
  filterDropdown: ({
    setSelectedKeys,
    selectedKeys,
    confirm,
    clearFilters,
  }: any) => (
    <div style={{ padding: 8 }}>
      <Input
        placeholder={`Search ${dataIndex}`}
        value={selectedKeys[0]}
        onChange={(e) =>
          setSelectedKeys(e.target.value ? [e.target.value] : [])
        }
        onPressEnter={() => confirm()}
        style={{ marginBottom: 8, display: 'block' }}
      />
      <Button
        type="primary"
        onClick={() => confirm()}
        icon={<SearchOutlined />}
        size="small"
        style={{ width: '50%', marginRight: 8 }}
      >
        Search
      </Button>
      <Button onClick={() => clearFilters()} size="small" style={{ width: 90 }}>
        Reset
      </Button>
    </div>
  ),
  filterIcon: (filtered: boolean) => (
    <div style={{ width: '1rem' }}>
      <SearchOutlined size={40} />
    </div>
  ),
  onFilter: (value: string, record: ITransaction) => {
    const fieldValue = record[dataIndex]
      ? record[dataIndex].toString().toLowerCase()
      : ''
    return fieldValue.includes(value.toLowerCase())
  },
})

const getDateColumnProps = (dataIndex: keyof ITransaction) => ({
  filterDropdown: ({
    setSelectedKeys,
    selectedKeys,
    confirm,
    clearFilters,
  }: any) => (
    <div style={{ padding: 8 }}>
      <RangePicker
        onChange={(dates) => {
          if (dates) {
            const formattedDates = dates.map((date) =>
              date.format('YYYY-MM-DD')
            )
            setSelectedKeys(formattedDates)
          } else {
            setSelectedKeys([])
          }
        }}
        style={{ marginBottom: 8, display: 'block' }}
      />
      <Button
        type="primary"
        onClick={() => confirm()}
        size="small"
        style={{ width: 90, marginRight: 8 }}
      >
        Search
      </Button>
      <Button onClick={() => clearFilters()} size="small" style={{ width: 90 }}>
        Reset
      </Button>
    </div>
  ),
  onFilter: (value: string, record: ITransaction) => {
    if (!value) return true
    const [startDate, endDate] = (value as string).split(',')
    const recordDate = new Date(record[dataIndex] as string)
    return (
      (!startDate || recordDate >= new Date(startDate)) &&
      (!endDate || recordDate <= new Date(endDate))
    )
  },
  sorter: (a: ITransaction, b: ITransaction) => {
    const dateA = a[dataIndex] ? new Date(a[dataIndex] as string).getTime() : 0
    const dateB = b[dataIndex] ? new Date(b[dataIndex] as string).getTime() : 0
    return dateA - dateB
  },
})

const getPrPrIcon = (prPr: string) => {
  switch (prPr) {
    case 'p':
      return {
        icon: <LoadingOutlined style={{ color: 'blue' }} />,
        text: 'проводиться',
      }
    case 't':
      return {
        icon: <CloseCircleOutlined style={{ color: 'red' }} />,
        text: 'сторнована',
      }
    case 'r':
      return {
        icon: <CheckCircleOutlined style={{ color: 'green' }} />,
        text: 'проведена',
      }
    case 'n':
      return {
        icon: <StopOutlined style={{ color: 'gray' }} />,
        text: 'забракована',
      }
    default:
      return {
        icon: <InfoCircleOutlined style={{ color: 'black' }} />,
        text: 'невідомо',
      }
  }
}

const getTrantypeFilterProps = () => ({
  filters: [
    { text: 'Debet', value: 'D' },
    { text: 'Credit', value: 'C' },
  ],
  defaultFilteredValue: ['C'],

  onFilter: (value: string, record: ITransaction) => record.TRANTYPE === value,
})

// Main column generator function
export const generateColumns = (
  visibleColumns: string[],
  domain: IExtendedDomain,
  toggleColumnVisibility: (columnKey: string) => void,
  companies: IRealestate[],
  refetchTransactions?: () => void
): ColumnsType<ITransaction> => {
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

  const columns: ColumnsType<ITransaction> = [
    {
      title: 'Counterparty Name',
      width: '25%',
      dataIndex: 'AUT_CNTR_NAM',
      key: 'AUT_CNTR_NAM',
      ...getColumnSearchProps('AUT_CNTR_NAM'),
    },
    { title: 'My CRF', dataIndex: 'AUT_MY_CRF', key: 'AUT_MY_CRF' },
    { title: 'My MFO', dataIndex: 'AUT_MY_MFO', key: 'AUT_MY_MFO' },
    { title: 'My Account', dataIndex: 'AUT_MY_ACC', key: 'AUT_MY_ACC' },
    { title: 'My Name', dataIndex: 'AUT_MY_NAM', key: 'AUT_MY_NAM' },
    {
      title: 'My MFO Name',
      dataIndex: 'AUT_MY_MFO_NAME',
      key: 'AUT_MY_MFO_NAME',
    },
    {
      title: 'My MFO City',
      dataIndex: 'AUT_MY_MFO_CITY',
      key: 'AUT_MY_MFO_CITY',
    },
    {
      title: 'Counterparty CRF',
      dataIndex: 'AUT_CNTR_CRF',
      key: 'AUT_CNTR_CRF',
      width: '300px',
      ...getColumnSearchProps('AUT_CNTR_CRF'),
    },
    {
      title: 'Counterparty MFO',
      dataIndex: 'AUT_CNTR_MFO',
      key: 'AUT_CNTR_MFO',
      ...getColumnSearchProps('AUT_CNTR_MFO'),
    },
    {
      title: 'Counterparty Account',
      dataIndex: 'AUT_CNTR_ACC',
      key: 'AUT_CNTR_ACC',
      width: '200px',
      ...getColumnSearchProps('AUT_CNTR_ACC'),
    },
    {
      title: 'Counterparty MFO Name',
      dataIndex: 'AUT_CNTR_MFO_NAME',
      key: 'AUT_CNTR_MFO_NAME',
    },
    {
      title: 'Counterparty MFO City',
      dataIndex: 'AUT_CNTR_MFO_CITY',
      key: 'AUT_CNTR_MFO_CITY',
    },
    { title: 'Currency', dataIndex: 'CCY', key: 'CCY' },
    { title: 'Real Flag', dataIndex: 'FL_REAL', key: 'FL_REAL' },
    {
      title: 'Transaction Status',
      dataIndex: 'PR_PR',
      key: 'PR_PR',
      render: (text: string) => {
        const { icon, text: description } = getPrPrIcon(text)
        return (
          <Popover content={description} title="Status">
            {icon}
          </Popover>
        )
      },
    },
    { title: 'Document Type', dataIndex: 'DOC_TYP', key: 'DOC_TYP' },
    { title: 'Document Number', dataIndex: 'NUM_DOC', key: 'NUM_DOC' },
    {
      title: 'Client Date',
      dataIndex: 'DAT_KL',
      key: 'DAT_KL',
      ...getDateColumnProps('DAT_KL'),
    },
    {
      title: 'Transaction Date',
      dataIndex: 'DAT_OD',
      key: 'DAT_OD',
      ...getDateColumnProps('DAT_OD'),
    },
      {
      title: 'Description',
      dataIndex: 'OSND',
      key: 'OSND',
      width: 300,
      render: (text: string, record: ITransaction) => {
        return getResolvedDescription(record, companies);
      },
    },
    { title: 'Amount', dataIndex: 'SUM', key: 'SUM', width: '10%' },
    { title: 'Amount E', dataIndex: 'SUM_E', key: 'SUM_E' },
    { title: 'Reference', dataIndex: 'REF', key: 'REF' },
    { title: 'Reference Number', dataIndex: 'REFN', key: 'REFN' },
    { title: 'Payment Time', dataIndex: 'TIM_P', key: 'TIM_P' },
    {
      title: 'Transaction Time',
      width: '15%',
      dataIndex: 'DATE_TIME_DAT_OD_TIM_P',
      key: 'DATE_TIME_DAT_OD_TIM_P',
      ...getDateColumnProps('DATE_TIME_DAT_OD_TIM_P'),
    },
    {
      title: <span style={{ whiteSpace: 'nowrap' }}>Type</span>, // TRANTYPE column
      width: '7%',
      dataIndex: 'TRANTYPE',
      key: 'TRANTYPE',
      ...getTrantypeFilterProps(),
    },
    { title: 'Dealer', dataIndex: 'DLR', key: 'DLR' },
    {
      title: 'Technical Transaction ID',
      dataIndex: 'TECHNICAL_TRANSACTION_ID',
      key: 'TECHNICAL_TRANSACTION_ID',
    },
    {
      title: (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Options</span>
          <Dropdown
            overlayStyle={{ overflow: 'scroll', maxHeight: '300px' }}
            menu={{ items }}
            trigger={['click']}
          >
            <SettingOutlined style={{ cursor: 'pointer' }} />
          </Dropdown>
        </div>
      ),
      width: '25%',
      dataIndex: 'OPTIONS',
      key: 'OPTIONS',
      render: (text: string, record: ITransaction) => (
        <TransactionDrawer transaction={record} domain={domain} refetchTransactions={refetchTransactions} />
      ),
    },
  ].filter(
    (column) =>
      typeof column.key === 'string' &&
      visibleColumns.includes(column.key as string)
  )

  return columns
}

export const columnNames = [
  'AUT_MY_CRF',
  'AUT_MY_MFO',
  'AUT_MY_ACC',
  'AUT_MY_NAM',
  'AUT_MY_MFO_NAME',
  'AUT_MY_MFO_CITY',
  'AUT_CNTR_CRF',
  'AUT_CNTR_MFO',
  'AUT_CNTR_ACC',
  'AUT_CNTR_NAM',
  'AUT_CNTR_MFO_NAME',
  'AUT_CNTR_MFO_CITY',
  'CCY',
  'FL_REAL',
  'PR_PR',
  'DOC_TYP',
  'NUM_DOC',
  'DAT_KL',
  'DAT_OD',
  'OSND',
  'SUM',
  'SUM_E',
  'REF',
  'REFN',
  'TIM_P',
  'DATE_TIME_DAT_OD_TIM_P',
  'ID',
  'TRANTYPE',
  'DLR',
  'TECHNICAL_TRANSACTION_ID',
]

export const defaultVisibleColumns = [
  'AUT_CNTR_NAM',
  'OSND',
  'SUM',
  'DATE_TIME_DAT_OD_TIM_P',
  'TRANTYPE',
  'OPTIONS',
]
