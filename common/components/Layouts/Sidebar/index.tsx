'use client'

import { LogoIcon } from '@assets/icon/Logo'
import { Menu } from '@components/UI/Menu'
import useSidebar from '@modules/hooks/useSidebar'
import { AppRoutes } from '@utils/constants'
import { Layout, SiderProps, theme, Typography } from 'antd'
import Link from 'next/link'
import styles from './style.module.scss'

export const Sidebar: React.FC<Omit<SiderProps, 'children'>> = (props) => {
  const { token } = theme.useToken()
  const { collapsed, toggleCollapsed } = useSidebar()

  return (
    <Layout.Sider
      theme="light"
      collapsed={collapsed}
      width={240}
      onCollapse={() => toggleCollapsed()}
      {...props}
    >
      <Link href={AppRoutes.INDEX} className={styles.Logo}>
        <LogoIcon style={{ fontSize: 40, color: token.colorPrimary }} />
        {!collapsed && (
          <Typography.Title level={4} style={{ margin: 0, textWrap: 'nowrap' }}>
            E-ORENDA
          </Typography.Title>
        )}
      </Link>
      <Menu
        defaultOpenKeys={
          !collapsed
            ? ['user_submenu', 'dashboard_submenu', 'payments_submenu']
            : []
        }
      />
    </Layout.Sider>
  )
}
