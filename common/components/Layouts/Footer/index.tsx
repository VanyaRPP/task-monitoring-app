'use client'

import { LogoIcon } from '@assets/icon/Logo'
import { Flex, Layout, theme } from 'antd'
import classNames from 'classnames'
import styles from './style.module.scss'

export interface FooterProps {
  style?: React.CSSProperties
  className?: string
}

export const Footer: React.FC<FooterProps> = ({ className, style }) => {
  const { token } = theme.useToken()

  return (
    <Layout.Footer
      style={style}
      className={classNames(styles.Footer, className)}
    >
      <Flex align="center" style={{ height: '100%' }}>
        E-ORENDA ©{new Date().getFullYear()} Created by
        <LogoIcon
          style={{
            color: token.colorPrimary,
            marginInline: '0.25rem',
            fontSize: 24,
          }}
        />
        SPACEHUB
      </Flex>
    </Layout.Footer>
  )
}
