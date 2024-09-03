import React from 'react'
import { Table } from 'antd'

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

const TransactionsTable = ({ transactions }) => {
  const columns = [
    {
      title: 'My CRF',
      dataIndex: 'AUT_MY_CRF',
      key: 'AUT_MY_CRF',
    },
    {
      title: 'My MFO',
      dataIndex: 'AUT_MY_MFO',
      key: 'AUT_MY_MFO',
    },
    {
      title: 'My Account',
      dataIndex: 'AUT_MY_ACC',
      key: 'AUT_MY_ACC',
    },
    {
      title: 'My Name',
      dataIndex: 'AUT_MY_NAM',
      key: 'AUT_MY_NAM',
    },
    {
      title: 'Counterparty CRF',
      dataIndex: 'AUT_CNTR_CRF',
      key: 'AUT_CNTR_CRF',
    },
    {
      title: 'Counterparty MFO',
      dataIndex: 'AUT_CNTR_MFO',
      key: 'AUT_CNTR_MFO',
    },
    {
      title: 'Counterparty Account',
      dataIndex: 'AUT_CNTR_ACC',
      key: 'AUT_CNTR_ACC',
    },
    {
      title: 'Currency',
      dataIndex: 'CCY',
      key: 'CCY',
    },
    {
      title: 'Amount',
      dataIndex: 'SUM',
      key: 'SUM',
    },
    {
      title: 'Transaction Date',
      dataIndex: 'DAT_OD',
      key: 'DAT_OD',
    },
    {
      title: 'Transaction Time',
      dataIndex: 'TIM_P',
      key: 'TIM_P',
    },
  ]

  return (
    <Table
      scroll={{ x: true }}
      dataSource={transactions}
      columns={columns}
      rowKey="ID"
    />
  )
}

export default TransactionsTable
