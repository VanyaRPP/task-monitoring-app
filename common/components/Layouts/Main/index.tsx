import { Footer } from '@common/components/Layouts/Footer'
import { Header } from '@common/components/Layouts/Header'
import { Sidebar } from '@common/components/Layouts/Sidebar'
import { Breadcrumb, BreadcrumbPath } from '@common/components/UI/Breadcrumb'
import { Layout, Space } from 'antd'
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
        <Header className={styles.Header} />
        <Layout className={styles.Wrapper}>
          <Space direction="vertical">
            <Breadcrumb path={path} />
            <Layout.Content className={styles.Content}>
              {children}
            </Layout.Content>
          </Space>
        </Layout>
        <Footer />
      </Layout>
    </Layout>
  )
}

export default MainLayout
