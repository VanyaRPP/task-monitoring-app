'use client'

import { Footer } from '@components/Layouts/Footer'
import { Header } from '@components/Layouts/Header'
import { Sidebar } from '@components/Layouts/Sidebar'
import { BreadcrumbPath } from '@components/UI/Breadcrumb'
import { FloatButtonItem } from '@utils/types'
import { Layout } from 'antd'
import { FloatButtonsLayoutAddon } from './FloatButtonsLayoutAddon'

import styles from './style.module.scss'

export interface MainLayoutProps {
  children: React.ReactNode
  path?: BreadcrumbPath[]
  simple?: boolean
  floatButtons?: FloatButtonItem[]
  onPathClick?: (path: string) => void
  hideHeader?: boolean
  hideFooter?: boolean
  hideFloatButtons?: boolean
}

const MainLayoutInner: React.FC<MainLayoutProps> = ({
  children,
  path,
  simple,
  floatButtons,
  onPathClick,
  hideHeader,
  hideFooter,
  hideFloatButtons,
}) => {
  if (simple) {
    return (
      <Layout className={styles.SimpleWrapper}>
        {!hideFloatButtons && (
          <FloatButtonsLayoutAddon buttons={floatButtons} />
        )}
        <Layout.Content className={styles.Content}>{children}</Layout.Content>
      </Layout>
    )
  }

  return (
    <Layout hasSider>
      {!hideFloatButtons && <FloatButtonsLayoutAddon buttons={floatButtons} />}
      <Sidebar collapsible className={styles.Sidebar} />
      <Layout>
        {!hideHeader && (
          <Header
            className={styles.Header}
            path={path}
            onPathClick={onPathClick}
          />
        )}
        <Layout className={styles.Wrapper}>
          <Layout.Content className={styles.Content}>{children}</Layout.Content>
        </Layout>
        {!hideFooter && <Footer className={styles.Footer} />}
      </Layout>
    </Layout>
  )
}

export default MainLayoutInner
