import { Card } from 'antd'
import React, { FC, ReactNode } from 'react'
import PaymentCardHeader from '../PaymentCardHeader'
import s from './style.module.scss'

interface Props {
  children: ReactNode
  title: ReactNode
}

const TableCard: FC<Props> = ({ children, title }) => {
  return (
    <Card className={s.Card} title={title} style={{ flex: '1.5' }}>
      {children}
    </Card>
  )
}

export default TableCard
