import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons'
import { Card, Col, Row, Statistic } from 'antd'
import React, { FC } from 'react'

export interface IBalance {
  acc: string // Account number
  currency: string // Currency type (e.g., UAH)
  balanceIn: string // Balance incoming
  balanceInEq: string // Balance incoming equivalent
  balanceOut: string // Balance outgoing
  balanceOutEq: string // Balance outgoing equivalent
  turnoverDebt: string // Turnover debt
  turnoverDebtEq: string // Turnover debt equivalent
  turnoverCred: string // Turnover credit
  turnoverCredEq: string // Turnover credit equivalent
  bgfIBrnm: string // Branch information, if available
  brnm: string // Branch name
  dpd: string // Date of processing (could represent the last processing date)
  nameACC: string // Name on the account
  state: string // State of the account (e.g., active, 'a')
  atp: string // Account type (e.g., 'L')
  flmn: string // Branch/Location code
  date_open_acc_reg: string // Date the account was registered
  date_open_acc_sys: string // Date the account was opened in the system
  date_close_acc: string // Date the account was closed (if applicable)
  is_final_bal: boolean // Is final balance or not
}

export interface IBalancesData {
  exist_next_page: boolean
  next_page_id: string
  status: string
  balances: IBalance[]
}

interface Props {
  balanceData: IBalance
}
const DomainBankBalance: FC<Props> = ({ balanceData }) => {
  const { currency, balanceIn, balanceOut, nameACC, acc, turnoverDebt } =
    balanceData

  return (
    <Card bordered={false} loading={!balanceData} style={{ height: '300px' }}>
      <Card.Meta
        title={nameACC}
        description={acc}
        avatar={
          <Statistic title={`Balance (${currency})`} value={turnoverDebt} />
        }
      />
      <Row gutter={16}>
        <Col span={12}>
          <Card bordered={false}>
            <Statistic
              title="In"
              value={balanceIn}
              precision={1}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowUpOutlined />}
              suffix={currency}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card bordered={false}>
            <Statistic
              title="Out"
              value={balanceOut}
              precision={1}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ArrowDownOutlined />}
              suffix={currency}
            />
          </Card>
        </Col>
      </Row>
    </Card>
  )
}

export default DomainBankBalance
