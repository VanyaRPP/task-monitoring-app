'use client'
import { Input, InputProps } from 'antd'
import React from 'react'
import classNames from 'classnames'
import styles from './styles.module.scss'

export const GlassInput: React.FC<InputProps> = ({ className, ...rest }) => {
  return (
    <Input {...rest} className={classNames(styles.glassInput, className)} />
  )
}
