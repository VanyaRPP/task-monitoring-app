import { Layout } from 'antd'
import classNames from 'classnames'
import styles from './style.module.scss'

export interface HeaderProps {
  style?: React.CSSProperties
  className?: string
}

export const Header: React.FC<HeaderProps> = ({ className, style }) => {
  return (
    <Layout.Header
      style={style}
      className={classNames(styles.Header, className)}
    >
      E-ORENDA ©{new Date().getFullYear()} Create by SPACEHUB
    </Layout.Header>
  )
}
