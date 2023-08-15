import { Card } from 'antd'
import cn from 'classnames'
import React, { FC, ReactNode } from 'react'
import s from './style.module.scss'

interface Props {
  children?: ReactNode
  title?: ReactNode
  className?: string
  style?: React.CSSProperties
}

const TableCard: FC<Props> = ({ children, title, className, style }) => {
  return (
    <Card className={cn(s.Card, className)} style={style} title={title}>
      {children}
    </Card>
  )
}

export default TableCard
