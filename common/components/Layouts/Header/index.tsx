import { Avatar } from '@components/UI/Avatar'
import { Breadcrumb, BreadcrumbPath } from '@components/UI/Breadcrumb'
import ThemeSwitcher from '@components/UI/ThemeSwitcher'
import { Flex, Layout } from 'antd'
import classNames from 'classnames'
import styles from './style.module.scss'

export interface HeaderProps {
  style?: React.CSSProperties
  className?: string
  path?: BreadcrumbPath[]
}

export const Header: React.FC<HeaderProps> = ({ className, style, path }) => {
  return (
    <Layout.Header
      style={style}
      className={classNames(styles.Header, className)}
    >
      <Flex
        justify="space-between"
        gap={8}
        align="center"
        style={{ height: '100%' }}
      >
        <Breadcrumb path={path} />
        <Flex gap={8} align="center">
          <ThemeSwitcher />
          <Avatar />
        </Flex>
      </Flex>
    </Layout.Header>
  )
}
