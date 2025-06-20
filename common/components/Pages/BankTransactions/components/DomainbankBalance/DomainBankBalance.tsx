import { useAppDispatch, useAppSelector } from '@modules/store/hooks'
import { setAccount } from '@modules/store/bankSlice'
import { Card, Select, Statistic } from 'antd'
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

interface Props {
  balancesData: IBalance[]
}

const DomainBankBalance: FC<Props> = ({ balancesData }) => {
  const dispatch = useAppDispatch()
  const selectedAccount = useAppSelector((state) => state.bank.account)

  const balance = balancesData.find((b) => b.acc === selectedAccount)

  const { currency, balanceOut, nameACC, acc } = balance ?? {}

  return (
    <Card loading={!balance} style={{ marginBottom: 8 }}>
      <Card.Meta
        title={nameACC}
        avatar={
          <Statistic
            title={`Balance (${currency})`}
            value={Number(balanceOut)}
            precision={2}
          />
        }
        description={
          <Select
            value={acc}
            style={{ minWidth: 320 }}
            onChange={(value) => dispatch(setAccount(value))}
            options={balancesData.map((b) => ({
              value: b.acc,
              label: b.acc,
            }))}
          />
        }
      />
    </Card>
  )
}

export default DomainBankBalance
