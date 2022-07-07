import React, { useState } from 'react'
import { Layout } from 'antd'
import Head from 'next/head'
import MainFooter from '../Footer'
import MainHeader from '../Header'
import Sidebar from '../Sidebar'
import { SearchBar } from '../SearchBar'
import s from './MainLayout.style.module.scss'

import { useSession } from 'next-auth/react'

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

        <Layout>
          <MainHeader />
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
            <div className={s.Background}>{children}</div>
          </Layout.Content>
          <MainFooter
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
