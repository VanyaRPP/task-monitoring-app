import { SunFilled } from '@ant-design/icons'
import { Avatar } from '@components/UI/Avatar'
import { Breadcrumb, BreadcrumbPath } from '@components/UI/Breadcrumb'
import { Button, Flex, Layout } from 'antd'
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
          <Button icon={<SunFilled />} size="large" shape="circle" />
          <Avatar />
        </Flex>
      </Flex>
    </Layout.Header>
  )
}
