import React, { useState } from 'react'
import { Layout } from 'antd'
import Head from 'next/head'
import Footer from '../Footer'
import Header from '../Header'
import Sidebar from '../Sidebar'
import { SearchBar } from '../SearchBar'
import { useSession } from 'next-auth/react'
import s from './MainLayout.style.module.scss'

interface Props {
  children: React.ReactNode
}

const MainLayout: React.FC<Props> = ({ children }) => {
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(true)

  return (
    <>
      <Head>
        <title>Task-monitoring-app</title>
      </Head>

      <Layout className={s.Layout}>
        {session?.user && (
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        )}

        <Layout className={s.Background}>
          <Header />
          <Layout.Content
            className={s.Container}
            style={{
              marginLeft: session?.user
                ? collapsed
                  ? '80px'
                  : '200px'
                : '0px',
            }}
          >
            <SearchBar className={s.SearchBar} />
            <div className={s.Foreground}>{children}</div>
          </Layout.Content>
          <Footer
            style={{
              marginLeft: session?.user
                ? collapsed
                  ? '80px'
                  : '200px'
                : '0px',
            }}
          />
        </Layout>
      </Layout>
    </>
  )
}

export default MainLayout
