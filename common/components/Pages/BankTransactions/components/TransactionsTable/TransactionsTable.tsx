import React from 'react'
import { Table, Input, Button, Popover } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  SearchOutlined,
  StopOutlined,
} from '@ant-design/icons'

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
    { title: 'Client Date', dataIndex: 'DAT_KL', key: 'DAT_KL' },
    { title: 'Transaction Date', dataIndex: 'DAT_OD', key: 'DAT_OD' },
    { title: 'Description', dataIndex: 'OSND', key: 'OSND' },
    { title: 'Amount', dataIndex: 'SUM', key: 'SUM' },
    { title: 'Amount E', dataIndex: 'SUM_E', key: 'SUM_E' },
    { title: 'Reference', dataIndex: 'REF', key: 'REF' },
    { title: 'Reference Number', dataIndex: 'REFN', key: 'REFN' },
    { title: 'Transaction Time', dataIndex: 'TIM_P', key: 'TIM_P' },
    {
      title: 'Date Time',
      dataIndex: 'DATE_TIME_DAT_OD_TIM_P',
      key: 'DATE_TIME_DAT_OD_TIM_P',
    },
    { title: 'ID', dataIndex: 'ID', key: 'ID' },
    { title: 'Transaction Type', dataIndex: 'TRANTYPE', key: 'TRANTYPE' },
    { title: 'DLR', dataIndex: 'DLR', key: 'DLR' },
    {
      title: 'Technical Transaction ID',
      dataIndex: 'TECHNICAL_TRANSACTION_ID',
      key: 'TECHNICAL_TRANSACTION_ID',
    },
  ]

  return (
    <Table<ITransaction>
      scroll={{ x: true }}
      dataSource={transactions}
      columns={columns}
      rowKey="ID"
    />
  )
}

export default TransactionsTable
