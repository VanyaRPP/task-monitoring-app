import { Card } from 'antd'
import cn from 'classnames'
import React, { FC, ReactNode } from 'react'
import s from './style.module.scss'

interface Props {
  children: ReactNode
  title?: ReactNode
  className?: string
}

const TableCard: FC<Props> = ({ children, title, className }) => {
  return (
    <Card
      className={cn(s.Card, className)}
      title={title}
      style={{ flex: '1.5' }}
    >
      {children}
    </Card>
  )
}

export default TableCard
