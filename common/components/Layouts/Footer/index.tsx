import { Layout } from 'antd'
import classNames from 'classnames'
import styles from './style.module.scss'

export interface FooterProps {
  style?: React.CSSProperties
  className?: string
}

export const Footer: React.FC<FooterProps> = ({ className, style }) => {
  return (
    <Layout.Footer
      style={style}
      className={classNames(styles.Footer, className)}
    >
      E-ORENDA ©{new Date().getFullYear()} Create by SPACEHUB
    </Layout.Footer>
  )
}
