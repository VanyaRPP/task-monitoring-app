'use client'

import { Footer } from '@components/Layouts/Footer'
import { Header } from '@components/Layouts/Header'
import { Sidebar } from '@components/Layouts/Sidebar'
import { BreadcrumbPath } from '@components/UI/Breadcrumb'
import { FloatButtonItem } from '@utils/types'
import { Layout } from 'antd'
import { FloatButtonsLayoutAddon } from './FloatButtonsLayoutAddon'
import AIChat from '@components/AIChat'

import styles from './style.module.scss'

export interface MainLayoutProps {
  children: React.ReactNode
  path?: BreadcrumbPath[]
  simple?: boolean
  floatButtons?: FloatButtonItem[]
  onPathClick?: (path: string) => void
}

const MainLayoutInner: React.FC<MainLayoutProps> = ({
  children,
  path,
  simple,
  floatButtons,
  onPathClick,
}) => {
  if (simple) {
    return (
      <Layout className={styles.SimpleWrapper}>
        <FloatButtonsLayoutAddon buttons={floatButtons} />
        <AIChat />
        <Layout.Content className={styles.Content}>{children}</Layout.Content>
      </Layout>
    )
  }

  return (
    <Layout hasSider>
      <FloatButtonsLayoutAddon buttons={floatButtons} />
      <AIChat />
      <Sidebar collapsible className={styles.Sidebar} />
      <Layout>
        <Header
          className={styles.Header}
          path={path}
          onPathClick={onPathClick}
        />
        <Layout className={styles.Wrapper}>
          <Layout.Content className={styles.Content}>{children}</Layout.Content>
        </Layout>
        <Footer className={styles.Footer} />
      </Layout>
    </Layout>
  )
}

export default MainLayoutInner
