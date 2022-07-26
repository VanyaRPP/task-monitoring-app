import React, { useState } from 'react'
import { Button, Layout } from 'antd'
import Head from 'next/head'
import Footer from '../Footer'
import Header from '../Header'
import Sidebar from '../Sidebar'
import { useSession } from 'next-auth/react'
import s from './MainLayout.style.module.scss'
import premiumIcon from '../../assets/premium/diamond.png'
import Image from 'next/image'
import Router from 'next/router'
import { AppRoutes } from 'utils/constants'

interface Props {
  children: React.ReactNode
}

const MainLayout: React.FC<Props> = ({ children }) => {
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(true)

  const { status } = useSession()

  status === 'authenticated'
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
