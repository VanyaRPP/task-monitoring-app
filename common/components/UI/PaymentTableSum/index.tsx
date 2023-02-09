import { Table } from 'antd'
import React, { FC } from 'react'

interface Props {
  totalDebit: number
  totalCredit: number
}

const PaymentTableSum: FC<Props> = ({ totalDebit, totalCredit }) => {
  return (
    <Table.Summary.Row>
      <Table.Summary.Cell index={0}>Всього:</Table.Summary.Cell>
      <Table.Summary.Cell index={1}></Table.Summary.Cell>
      <Table.Summary.Cell index={2}>
        <p style={{ color: 'red' }}>{totalDebit}</p>
      </Table.Summary.Cell>
      <Table.Summary.Cell index={3}>
        <p style={{ color: 'red' }}>{totalCredit}</p>
      </Table.Summary.Cell>
    </Table.Summary.Row>
  )
}

export default PaymentTableSum
