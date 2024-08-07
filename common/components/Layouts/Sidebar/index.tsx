import { AppRoutes } from '@utils/constants'
import { Layout, Menu, SiderProps, Typography } from 'antd'
import { useRouter } from 'next/router'
import { useState } from 'react'
import styles from './style.module.scss'

export const Sidebar: React.FC<Omit<SiderProps, 'children'>> = (props) => {
  const router = useRouter()

  // TODO: redux-based collapsed (to save collapse state between pages)
  const [collapsed, setCollapsed] = useState<boolean>(false)

  return (
    <Layout.Sider
      theme="light"
      onCollapse={() => setCollapsed(!collapsed)}
      collapsed={collapsed}
      {...props}
    >
      <Typography.Text className={styles.Logo}>
        {collapsed ? '[LOGO]' : '[LOGO] E-ORENDA'}
      </Typography.Text>
      <Menu
        selectedKeys={[router.asPath]}
        defaultOpenKeys={[
          'user_submenu',
          'dashboard_submenu',
          'payments_submenu',
        ]}
        mode="inline"
        items={[
          {
            key: 'user_submenu',
            type: 'submenu',
            label: 'User',
            children: [
              {
                key: AppRoutes.DASHBOARD,
                type: 'item',
                label: 'Dashboard',
                onClick: () => router.push(AppRoutes.DASHBOARD),
              },
              {
                key: AppRoutes.PROFILE,
                type: 'item',
                label: 'Profile',
                onClick: () => router.push(AppRoutes.PROFILE),
              },
            ],
          },
          {
            key: 'dashboard_submenu',
            type: 'submenu',
            label: 'Dashboard',
            children: [
              {
                key: AppRoutes.INDEX,
                type: 'item',
                label: 'Home',
                onClick: () => router.push(AppRoutes.INDEX),
              },
              {
                key: AppRoutes.STREETS,
                type: 'item',
                label: 'Streets',
                onClick: () => router.push(AppRoutes.STREETS),
              },
              {
                key: AppRoutes.DOMAIN,
                type: 'item',
                label: 'Domains',
                onClick: () => router.push(AppRoutes.DOMAIN),
              },
              {
                key: AppRoutes.REAL_ESTATE,
                type: 'item',
                label: 'Companies',
                onClick: () => router.push(AppRoutes.REAL_ESTATE),
              },
              {
                key: AppRoutes.SERVICE,
                type: 'item',
                label: 'Services',
                onClick: () => router.push(AppRoutes.SERVICE),
              },
            ],
          },
          {
            key: 'payments_submenu',
            type: 'submenu',
            label: 'Payments',
            children: [
              {
                key: AppRoutes.PAYMENT,
                type: 'item',
                label: 'Payments',
                onClick: () => router.push(AppRoutes.PAYMENT),
              },
              {
                key: AppRoutes.PAYMENT_BULK,
                type: 'item',
                label: 'Bulk',
                onClick: () => router.push(AppRoutes.PAYMENT_BULK),
              },
              {
                key: AppRoutes.PAYMENT_CHART,
                type: 'item',
                label: 'Chart',
                onClick: () => router.push(AppRoutes.PAYMENT_CHART),
              },
            ],
          },
        ]}
      />
    </Layout.Sider>
  )
}
