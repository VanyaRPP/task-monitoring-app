import { Footer } from '@components/Layouts/Footer'
import { Header } from '@components/Layouts/Header'
import { Sidebar } from '@components/Layouts/Sidebar'
import { BreadcrumbPath } from '@components/UI/Breadcrumb'
import { Layout } from 'antd'
import styles from './style.module.scss'

export interface MainLayoutProps {
  children: React.ReactNode
  path?: BreadcrumbPath[]
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, path }) => {
  return (
    <Layout>
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

export default MainLayout
