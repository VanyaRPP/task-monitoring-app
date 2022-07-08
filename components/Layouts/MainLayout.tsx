import React, { useState, useEffect } from 'react'
import { Layout } from 'antd'
import Head from 'next/head'
import MainFooter from '../Footer'
import MainHeader from '../Header'
import Sidebar from '../Sidebar'
import { SearchBar } from '../SearchBar'
import { useSession } from 'next-auth/react'
import { useAppSelector } from '../../store/hooks'

import styles from './MainLayout.style.module.scss'

interface Props {
  children: React.ReactNode
}

const themes = {
  light: {
    textColor: 'rgba(0, 0, 0, 0.8)',
    shadowColor: '#00000030',
    backgroundColor: '#f0f2f5',
    backgroundColorPrimary: '#fff',
    primaryColor: '#722ed1',
    primaryColorHover: '#9254de',
  },
  dark: {
    textColor: 'white',
    shadowColor: '#95959530',
    backgroundColor: '#010409',
    backgroundColorPrimary: '#0d1117',
    primaryColor: '#238636',
    primaryColorHover: '#2ea043',
  },
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

function useTheme(theme) {
  useEffect(() => {
    for (const key in theme) {
      document.documentElement.style.setProperty(`--${key}`, theme[key])
    }
  }, [theme])
}

export default MainLayout
