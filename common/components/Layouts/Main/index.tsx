'use client'

import { useEffect, useState } from 'react'
import { Footer } from '@components/Layouts/Footer'
import { Header } from '@components/Layouts/Header'
import { Sidebar } from '@components/Layouts/Sidebar'
import { BreadcrumbPath } from '@components/UI/Breadcrumb'
import { Layout, Button, Grid } from 'antd'
import { MenuOutlined } from '@ant-design/icons'
import styles from './style.module.scss'
import classNames from 'classnames'

export interface MainLayoutProps {
  children: React.ReactNode
  path?: BreadcrumbPath[]
}

const MainLayoutInner: React.FC<MainLayoutProps> = ({ children, path }) => {
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(false)
    }
  }, [isMobile])

  return (
    <Layout className={styles.Layout}>
      {!isMobile && (
        <Sidebar collapsible className={classNames(styles.Sidebar, styles.DesktopOnly)} />
      )}

      {isMobile && (
        <Button
          icon={<MenuOutlined />}
          onClick={() => setSidebarOpen(true)}
          className={styles.Burger}
        />
      )}

      {isMobile && sidebarOpen && (
        <>
          <div className={styles.Overlay} onClick={() => setSidebarOpen(false)} />
          <div className={classNames(styles.SidebarMobile, { [styles.open]: sidebarOpen })}>
            <Sidebar />
          </div>
        </>
      )}

      <Layout className={styles.MainLayout}>
        <Header className={styles.Header} path={path} />
        <Layout.Content className={styles.Content}>{children}</Layout.Content>
        <Footer className={styles.Footer} />
      </Layout>
    </Layout>
  )
}

export default MainLayoutInner
