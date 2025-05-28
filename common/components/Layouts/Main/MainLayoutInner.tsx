'use client'

import { FloatButtonsLayoutAddon } from './FloatButtonsLayoutAddon'
import { BreadcrumbPath } from '@components/UI/Breadcrumb'
import { Sidebar } from '@components/Layouts/Sidebar'
import { Footer } from '@components/Layouts/Footer'
import { Header } from '@components/Layouts/Header'
import { FloatButtonItem } from '@utils/types'
import { Layout } from 'antd'

import styles from './style.module.scss'

export interface MainLayoutProps {
  children: React.ReactNode
  path?: BreadcrumbPath[]
  simple?: boolean
  floatButtons?: FloatButtonItem[]
}

const MainLayoutInner: React.FC<MainLayoutProps> = ({
  children,
  path,
  simple,
  floatButtons,
}) => {
  if (simple) {
    return (
      <Layout className={styles.SimpleWrapper}>
        <FloatButtonsLayoutAddon buttons={floatButtons} />
        <Layout.Content className={styles.Content}>{children}</Layout.Content>
      </Layout>
    )
  }

  return (
    <Layout hasSider>
      <FloatButtonsLayoutAddon buttons={floatButtons} />
      <Sidebar collapsible className={styles.Sidebar} />
      <Layout>
        <Header className={styles.Header} path={path} />
        <Layout className={styles.Wrapper}>
          <Layout.Content className={styles.Content}>{children}</Layout.Content>
        </Layout>
        <Footer className={styles.Footer} />
      </Layout>
    </Layout>
  )
}

export default MainLayoutInner
