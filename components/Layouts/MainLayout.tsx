import { Layout } from 'antd'
import Head from 'next/head'
import MainFooter from '../Footer'
import MainHeader from '../Header'
import { SearchBar } from '../SearchBar'
import style from './MainLayout.style.module.scss'

interface Props {
  children: React.ReactNode
}

const MainLayout: React.FC<Props> = ({ children }) => {
  return (
    <>
      <Head>
        <title>Task-monitoring-app</title>
      </Head>
      <Layout className={style.Layout}>
        <MainHeader />
        <Layout>
          <Layout.Content className={style.Container}>
            <SearchBar className={style.SearchBar} />
            <div className={style.Background}>{children}</div>
          </Layout.Content>
        </Layout>
        <MainFooter />
      </Layout>
    </>
  )
}

export default MainLayout
