'use client'

import React from 'react'
import { Input } from 'antd'
import type { PasswordProps } from 'antd/es/input'
import type { InputProps } from 'antd'
import classNames from 'classnames'
import styles from './styles.module.scss'

const BaseGlassInput: React.FC<InputProps> = ({
  className,
  status,
  ...rest
}) => {
  const combinedClass = classNames(styles.glassInput, className, {
    [styles.error]: status === 'error',
  })

  return <Input {...rest} status={status} className={combinedClass} />
}

const GlassPassword: React.FC<PasswordProps> = ({
  className,
  status,
  ...rest
}) => {
  const combinedClass = classNames(styles.glassInput, className, {
    [styles.error]: status === 'error',
  })

  return <Input.Password {...rest} status={status} className={combinedClass} />
}

export const GlassInput = Object.assign(BaseGlassInput, {
  Password: GlassPassword,
})
