import { useAppDispatch, useAppSelector } from '@modules/store/hooks'
import { setAccount } from '@modules/store/bankSlice'
import { Card, Select, Statistic } from 'antd'
import React, { FC } from 'react'

export interface IBalance {
  acc: string
  currency: string
  balanceOut: string
  nameACC: string
  balanceIn?: string
  balanceInEq?: string
  balanceOutEq?: string
  turnoverDebt?: string
  turnoverDebtEq?: string
  turnoverCred?: string
  turnoverCredEq?: string
  bgfIBrnm?: string
  brnm?: string
  dpd?: string
  state?: string
  atp?: string
  flmn?: string
  date_open_acc_reg?: string
  date_open_acc_sys?: string
  date_close_acc?: string
  is_final_bal?: boolean
}

export interface IBalancesData {
  exist_next_page: boolean
  next_page_id: string
  status: string
  balances: IBalance[]
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
