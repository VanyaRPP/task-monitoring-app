import { AppRoutes } from '@utils/constants'
import { Layout, Menu, SiderProps } from 'antd'
import { useRouter } from 'next/router'
import styles from './style.module.scss'

export const Sidebar: React.FC<Omit<SiderProps, 'children'>> = (props) => {
  const router = useRouter()

  // TODO: redux based collapse (to save collapse state between pages)

  return (
    <Layout.Sider theme="light" {...props}>
      <div className={styles.Logo}>[LOGO] E-ORENDA</div>
      <Menu
        selectedKeys={[router.asPath]}
        defaultOpenKeys={['user', 'dashboard']}
        mode="inline"
        items={[
          {
            key: 'user',
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
            key: 'dashboard',
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
            ],
          },
        ]}
      />
    </Layout.Sider>
  )
}
