import { Layout } from 'antd'
import Head from 'next/head'
import MainFooter from '../Footer'
import MainHeader from '../Header'
import { SearchBar } from '../SearchBar'
import s from './MainLayout.style.module.scss'

interface Props {
  children: React.ReactNode
}

const MainLayout: React.FC<Props> = ({ children }) => {
  return (
    <>
      <Head>
        <title>Task-monitoring-app</title>
      </Head>
      <Layout className={s.Layout}>
        <MainHeader />
        <Layout>
          <Layout.Content className={s.Container}>
            <SearchBar className={s.SearchBar} />
            <div className={s.Background}>{children}</div>
          </Layout.Content>
        </Layout>
        <MainFooter />
      </Layout>
    </>
  )
}

export default MainLayout
