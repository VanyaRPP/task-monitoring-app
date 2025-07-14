'use client'

import React from 'react'
import { Button } from 'antd'
import type { ButtonProps } from 'antd'
import classNames from 'classnames'
import styles from './styles.module.scss'

export const GlassButton: React.FC<ButtonProps> = ({ className, ...rest }) => {
  const combinedClass = classNames(styles.glassButton, className)

  return <Button {...rest} className={combinedClass} />
}
