import React from 'react'
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
        <Layout className={s.Background}>
          <Header />
          <Layout.Content className={s.Container}>
            <div className={s.Foreground}>{children}</div>
          </Layout.Content>
          <Footer />
        </Layout>
      </Layout>
    </>
  )
}

export default MainLayout
