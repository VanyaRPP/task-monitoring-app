import { Layout } from 'antd'
import Head from 'next/head'
import Footer from '../Footer'
import Header from '../Header'
import s from './MainLayout.style.module.scss'

interface Props {
  children: React.ReactNode
}

const MainLayout: React.FC<Props> = ({ children }) => {
  return (
    <>
      <Head>
        <title>Персональний кабінет</title>
      </Head>

      <Layout className={s.Layout}>
        <Header />
        <Layout.Content className={s.Content}>{children}</Layout.Content>
        <Footer />
      </Layout>
    </>
  )
}

export default MainLayout
