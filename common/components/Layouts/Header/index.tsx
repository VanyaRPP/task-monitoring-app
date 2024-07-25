import { Avatar } from '@components/UI/Avatar'
import { Breadcrumb, BreadcrumbPath } from '@components/UI/Breadcrumb'
import { Flex, Layout } from 'antd'
import classNames from 'classnames'
import styles from './style.module.scss'

export interface HeaderProps {
  style?: React.CSSProperties
  className?: string
  path?: BreadcrumbPath[]
  onPathClick?: (path: string) => void
}

export const Header: React.FC<HeaderProps> = ({
  className,
  style,
  path,
  onPathClick,
}) => {
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
        <Breadcrumb path={path} onPathClick={onPathClick} />
        <Flex gap={8} align="center">
          <Avatar />
        </Flex>
      </Flex>
    </Layout.Header>
  )
}
