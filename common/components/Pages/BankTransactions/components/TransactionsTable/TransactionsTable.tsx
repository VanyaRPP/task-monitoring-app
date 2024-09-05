import React, { useState } from 'react'
import {
  Table,
  Input,
  Button,
  Popover,
  DatePicker,
  Dropdown,
  Checkbox,
  MenuProps,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  SearchOutlined,
  SettingOutlined,
  StopOutlined,
} from '@ant-design/icons'

const { RangePicker } = DatePicker

export interface ITransactionData {
  exist_next_page: boolean
  next_page_id: string
  status: string
  transactions: ITransaction[]
}

export interface IBankRes<T> {
  data: T
}

export interface ITransaction {
  AUT_MY_CRF: string
  AUT_MY_MFO: string
  AUT_MY_ACC: string
  AUT_MY_NAM: string
  AUT_MY_MFO_NAME: string
  AUT_MY_MFO_CITY: string
  AUT_CNTR_CRF: string
  AUT_CNTR_MFO: string
  AUT_CNTR_ACC: string
  AUT_CNTR_NAM: string
  AUT_CNTR_MFO_NAME: string
  AUT_CNTR_MFO_CITY: string
  CCY: string
  FL_REAL: string
  PR_PR: string
  DOC_TYP: string
  NUM_DOC: string
  DAT_KL: string
  DAT_OD: string
  OSND: string
  SUM: string
  SUM_E: string
  REF: string
  REFN: string
  TIM_P: string
  DATE_TIME_DAT_OD_TIM_P: string
  ID: string
  TRANTYPE: string
  DLR: string
  TECHNICAL_TRANSACTION_ID: string
}

const TransactionsTable: React.FC<{ transactions: ITransaction[] }> = ({
  transactions,
}) => {
  const columnNames = [
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

  const defaultVisibleColums = [
    'AUT_CNTR_NAM',
    'AUT_CNTR_ACC',
    'OSND',
    'SUM',
    'PR_PR',
    'DATE_TIME_DAT_OD_TIM_P',
  ]

  const [visibleColumns, setVisibleColumns] =
    useState<string[]>(defaultVisibleColums)

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
        <Button
          onClick={() => clearFilters()}
          size="small"
          style={{ width: 90 }}
        >
          Reset
        </Button>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <div style={{ width: '1rem' }}>
        <SearchOutlined size={40} />
      </div>
    ),
    onFilter: (value: string, record: ITransaction) =>
      record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
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
        <Button
          onClick={() => clearFilters()}
          size="small"
          style={{ width: 90 }}
        >
          Reset
        </Button>
      </div>
    ),
    onFilter: (value: string, record: ITransaction) => {
      if (!value) return true
      const [startDate, endDate] = (value as string).split(',')
      const recordDate = new Date(record[dataIndex])
      return (
        (!startDate || recordDate >= new Date(startDate)) &&
        (!endDate || recordDate <= new Date(endDate))
      )
    },
    sorter: (a: ITransaction, b: ITransaction) =>
      new Date(a[dataIndex]).getTime() - new Date(b[dataIndex]).getTime(),
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

  const handleColumnVisibilityChange = (e: any) => {
    const { value, checked } = e.target
    setVisibleColumns((prev) =>
      checked ? [...prev, value] : prev.filter((col) => col !== value)
    )
  }

  const items: MenuProps['items'] = columnNames.map((col, index) => ({
    key: index.toString(),
    label: (
      <Checkbox
        value={col}
        checked={visibleColumns.includes(col)}
        onChange={handleColumnVisibilityChange}
      >
        {col}
      </Checkbox>
    ),
  }))

  const columns: ColumnsType<ITransaction> = [
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
      ...getColumnSearchProps('AUT_CNTR_ACC'),
    },
    {
      title: 'Counterparty Name',
      dataIndex: 'AUT_CNTR_NAM',
      key: 'AUT_CNTR_NAM',
      ...getColumnSearchProps('AUT_CNTR_NAM'),
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
      title: 'PR Flag',
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
    { title: 'Description', dataIndex: 'OSND', key: 'OSND', width: 300 },
    { title: 'Amount', dataIndex: 'SUM', key: 'SUM' },
    { title: 'Amount E', dataIndex: 'SUM_E', key: 'SUM_E' },
    { title: 'Reference', dataIndex: 'REF', key: 'REF' },
    { title: 'Reference Number', dataIndex: 'REFN', key: 'REFN' },
    { title: 'Transaction Time', dataIndex: 'TIM_P', key: 'TIM_P' },
    {
      title: 'Date Time',
      dataIndex: 'DATE_TIME_DAT_OD_TIM_P',
      key: 'DATE_TIME_DAT_OD_TIM_P',
      ...getDateColumnProps('DATE_TIME_DAT_OD_TIM_P'),
    },
    { title: 'ID', dataIndex: 'ID', key: 'ID' },
    { title: 'Transaction Type', dataIndex: 'TRANTYPE', key: 'TRANTYPE' },
    { title: 'DLR', dataIndex: 'DLR', key: 'DLR' },
    {
      title: 'Technical Transaction ID',
      dataIndex: 'TECHNICAL_TRANSACTION_ID',
      key: 'TECHNICAL_TRANSACTION_ID',
    },
  ].filter((column) => visibleColumns.includes(column.key))

  const [tableSettingDropdovnVisible, setTableSettingDropdovnVisible] =
    useState<boolean>(false)

  return (
    <div>
      <Dropdown
        overlayStyle={{ overflow: 'scroll', maxHeight: '300px' }}
        open={tableSettingDropdovnVisible}
        onOpenChange={() =>
          setTableSettingDropdovnVisible(!tableSettingDropdovnVisible)
        }
        menu={{
          items,
        }}
        trigger={['click']}
      >
        <SettingOutlined />
      </Dropdown>
      <Table<ITransaction>
        scroll={{ x: true }}
        dataSource={transactions}
        columns={columns}
        pagination={false}
        rowKey="ID"
      />
    </div>
  )
}

export default TransactionsTable
