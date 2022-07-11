import React, { useState } from 'react'
import { Layout } from 'antd'
import Head from 'next/head'
import MainFooter from '../Footer'
import MainHeader from '../Header'
import Sidebar from '../Sidebar'
import { SearchBar } from '../SearchBar'
import { useSession } from 'next-auth/react'
import { useAppSelector } from '../../store/hooks'
import themes from '../../lib/themes.config'
import useTheme from '../../assets/hooks/useTheme'

import styles from './MainLayout.style.module.scss'

interface Props {
  children: React.ReactNode
}

const MainLayout: React.FC<Props> = ({ children }) => {
  const { theme } = useAppSelector((state) => state.themeReducer)

  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(true)

  useTheme(theme === 'light' ? themes.light : themes.dark)

  return (
    <>
      <Head>
        <title>Task-monitoring-app</title>
      </Head>

      <Layout className={`${styles.Dark} ${styles.Layout}`}>
        {session?.user && (
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        )}

        <Layout className={styles.Background}>
          <MainHeader />
          <Layout.Content
            className={styles.Container}
            style={{
              marginLeft: session?.user
                ? collapsed
                  ? '80px'
                  : '200px'
                : '0px',
            }}
          >
            <SearchBar className={styles.SearchBar} />
            <div className={styles.Foreground}>{children}</div>
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
