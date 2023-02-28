import { Card } from 'antd'
import React, { FC, ReactNode } from 'react'
import ServiceCardHeader from '../ServiceCardHeader'
import s from './style.module.scss'

interface Props {
  children: ReactNode
  title: ReactNode
}

const ServiceCard: FC<Props> = ({ children, title }) => {
  return (
    <Card className={s.Card} title={title} style={{ flex: '1.5' }}>
      {children}
    </Card>
  )
}

export default ServiceCard
