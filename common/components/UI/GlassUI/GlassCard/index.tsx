'use client'
import { Card, CardProps } from 'antd'
import React from 'react'
import style from './style.module.scss'
import classNames from 'classnames'

export const GlassCard: React.FC<CardProps> = ({
  children,
  className,
  ...rest
}) => {
  return (
    <Card {...rest} className={classNames(style.glassCard, className)}>
      {children}
    </Card>
  )
}
