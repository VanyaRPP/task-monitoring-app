import { Table } from 'antd'
import React, { FC } from 'react'

interface Props {
  totalectricPrice: number
  totalwaterPrice: number
  totalinflaPrice: number
}

const FavorTableSum: FC<Props> = ({
  totalectricPrice,
  totalwaterPrice,
  totalinflaPrice,
}) => {
  return (
    <Table.Summary.Row>
      <Table.Summary.Cell index={0}>Всього:</Table.Summary.Cell>
      <Table.Summary.Cell index={1}>
        <p style={{ color: 'red' }}>{totalectricPrice}</p>
      </Table.Summary.Cell>
      <Table.Summary.Cell index={2}>
        <p style={{ color: 'red' }}>{totalwaterPrice}</p>
      </Table.Summary.Cell>
      <Table.Summary.Cell index={3}>
        <p style={{ color: 'red' }}>{totalinflaPrice}</p>
      </Table.Summary.Cell>
    </Table.Summary.Row>
  )
}

export default FavorTableSum
